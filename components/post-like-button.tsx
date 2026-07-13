"use client";

import { ReactionButton } from "@/components/reaction-button";
import { setReaction, toggleLike } from "@/lib/likes";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType } from "@/lib/types";

type PostLikeButtonProps = {
  postId: string;
  initialLiked?: boolean;
  initialReaction?: ReactionType | null;
  initialCount: number;
  hideCount?: boolean;
  className?: string;
  onCountChange?: (count: number) => void;
};

export function PostLikeButton({
  postId,
  initialLiked = false,
  initialReaction = null,
  initialCount,
  hideCount = false,
  className,
  onCountChange,
}: PostLikeButtonProps) {
  return (
    <ReactionButton
      className={className}
      hideCount={hideCount}
      initialLiked={initialLiked}
      initialReaction={initialReaction}
      initialCount={initialCount}
      loginNext={`/post/${postId}/likes`}
      countHref={hideCount ? undefined : `/post/${postId}/likes`}
      onReact={async (reaction) => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sign in to react.");

        if (reaction === null) {
          const result = await toggleLike(supabase, postId, user.id);
          onCountChange?.(result.likesCount);
          return { reaction: result.reaction, likesCount: result.likesCount };
        }

        const result = await setReaction(supabase, postId, user.id, reaction);
        onCountChange?.(result.likesCount);
        return { reaction: result.reaction, likesCount: result.likesCount };
      }}
    />
  );
}
