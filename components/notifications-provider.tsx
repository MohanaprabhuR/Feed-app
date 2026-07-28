"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-provider";
import { notificationToast } from "@/lib/app-toast";
import {
  requestNotificationPermission,
  showBrowserNotification,
} from "@/lib/browser-notifications";
import {
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
  notificationRowToNotification,
  type NotificationRow,
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
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Read latest router/pathname inside the realtime callback without
  // re-subscribing the channel on every navigation.
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    routerRef.current = router;
    pathnameRef.current = pathname;
  }, [router, pathname]);

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

  const refreshUnreadCountRef = useRef(refreshUnreadCount);
  useEffect(() => {
    refreshUnreadCountRef.current = refreshUnreadCount;
  }, [refreshUnreadCount]);

  // Fire a browser notification + WhatsApp-style in-app toast for a freshly
  // inserted notification row. Refs keep this stable so the realtime channel
  // never re-subscribes on navigation.
  const announceIncomingNotification = useCallback(
    async (row: NotificationRow) => {
      const supabase = createClient();

      let actorName: string | null = null;
      let actorAvatar: string | undefined;
      if (row.actor_id) {
        const { data } = await supabase
          .from("profiles")
          .select("name, avatar")
          .eq("id", row.actor_id)
          .maybeSingle();
        actorName = (data?.name as string | undefined) ?? null;
        actorAvatar = (data?.avatar as string | undefined) ?? undefined;
      }

      const body = actorName ? `${actorName} ${row.message}` : row.message;
      // OS-level notification (only when the tab has permission granted).
      showBrowserNotification(row.type, body);

      // In-app toast — skip while the user is already on the notifications page.
      if (pathnameRef.current === "/notifications") return;
      const href = notificationHref(notificationRowToNotification(row));
      notificationToast({
        title: actorName ?? "FeedApp",
        message: row.message,
        avatar: actorAvatar,
        onClick: () => {
          // Reading via the toast clears the unread state everywhere: the DB
          // update fires a realtime UPDATE that refreshes the bell badge, and
          // the notifications list reloads it as read.
          void markNotificationRead(supabase, row.id, row.recipient_id)
            .then(() => refreshUnreadCountRef.current())
            .catch(() => {});
          routerRef.current.push(href);
        },
      });
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load on mount
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!userId) return;
    void requestNotificationPermission();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(
        `notifications:${userId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          void refreshUnreadCount();

          if (payload.eventType === "INSERT") {
            void announceIncomingNotification(payload.new as NotificationRow);
          }
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
  }, [userId, refreshUnreadCount, announceIncomingNotification]);

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
