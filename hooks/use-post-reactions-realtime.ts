"use client";

import { useEffect, useRef } from "react";
import { fetchReactionState } from "@/lib/likes";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType } from "@/lib/types";

type ReactionState = { likesCount: number; reactionSummary: ReactionType[] };

/**
 * Keeps a post's aggregate reaction count and stacked-badge summary live: when
 * another viewer reacts, the change streams in via Supabase Realtime instead
 * of waiting for a page refresh. Changes made by the current user are skipped
 * since the reaction button already applies them optimistically.
 */
export function usePostReactionsRealtime(
  postId: string,
  currentUserId: string | undefined,
  onRemoteChange: (state: ReactionState) => void,
) {
  const onRemoteChangeRef = useRef(onRemoteChange);

  useEffect(() => {
    onRemoteChangeRef.current = onRemoteChange;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(
        `post-likes:${postId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const changedUserId =
            (payload.new as { user_id?: string } | null)?.user_id ??
            (payload.old as { user_id?: string } | null)?.user_id;
          if (changedUserId && changedUserId === currentUserId) return;

          void fetchReactionState(supabase, postId).then((state) => {
            onRemoteChangeRef.current(state);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [postId, currentUserId]);
}
