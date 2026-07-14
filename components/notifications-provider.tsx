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
import {
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";

type NotificationsContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }
  return context;
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const supabase = createClient();
      const count = await fetchUnreadNotificationCount(supabase, userId);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [userId]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void refreshUnreadCount();
        },
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void refreshUnreadCount();
    }, 45_000);

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, refreshUnreadCount]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      const supabase = createClient();
      await markNotificationRead(supabase, notificationId, userId);
      setUnreadCount((count) => Math.max(0, count - 1));
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    await markAllNotificationsRead(supabase, userId);
    setUnreadCount(0);
  }, [userId]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
      markRead,
      markAllRead,
    }),
    [unreadCount, refreshUnreadCount, markRead, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
