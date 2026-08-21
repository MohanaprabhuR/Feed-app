"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { createClient } from "@/lib/supabase/client";

type PresenceContextValue = {
  isOnline: (userId: string) => boolean;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within PresenceProvider");
  }
  return context;
}

/** Live “who has the app open” via a shared Supabase Presence channel. */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset online set on sign-out
      setOnlineIds(new Set());
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    const sync = () => {
      setOnlineIds(new Set(Object.keys(channel.presenceState())));
    };

    channel.on("presence", { event: "sync" }, sync).subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel.track({ user_id: user.id });
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isOnline = useCallback(
    (userId: string) => onlineIds.has(userId),
    [onlineIds],
  );

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}
