"use client";

import { useEffect, useState } from "react";
import { searchProfiles } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export function useMentionSuggestions(
  query: string,
  excludeUserId?: string,
  enabled = true,
) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
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
          const results = await searchProfiles(supabase, query, {
            excludeUserId,
            limit: 8,
          });
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
  }, [query, excludeUserId, enabled]);

  return { users, loading };
}
