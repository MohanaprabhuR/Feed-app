"use client";

import { useEffect, useState } from "react";
import { searchFollowingForMentions } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export function useMentionSuggestions(
  query: string,
  userId?: string,
  enabled = true,
) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const supabase = createClient();
          const results = await searchFollowingForMentions(
            supabase,
            userId,
            query,
            { limit: 8 },
          );
          if (!cancelled) setUsers(results);
        } catch {
          if (!cancelled) setUsers([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, userId, enabled]);

  return { users, loading };
}
