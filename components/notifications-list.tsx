"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  Heart,
  MessageCircle,
  MessageSquareText,
  UserPlus,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useNotifications } from "@/components/notifications-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Loader } from "@/components/loader";
import { usePageLoad } from "@/hooks/use-page-load";
import { getErrorMessage } from "@/lib/errors";
import {
  fetchNotifications,
  notificationHref,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap = {
  like: Heart,
  comment: MessageSquareText,
  message: MessageCircle,
  follow: UserPlus,
  mention: MessageSquareText,
  system: MessageCircle,
  event: CalendarClock,
} as const;

const EMPTY_NOTIFICATIONS: Notification[] = [];

export function NotificationsList() {
  const { user, loading: userLoading } = useCurrentUser();
  const { markRead, markAllRead, refreshUnreadCount } = useNotifications();
  const {
    data: items,
    setData: setItems,
    loading,
    error,
    setError,
    reload: load,
  } = usePageLoad(
    async () => {
      const supabase = createClient();
      const data = await fetchNotifications(supabase, user!.id);
      await refreshUnreadCount();
      return data;
    },
    [user?.id],
    {
      enabled: Boolean(user),
      initialData: EMPTY_NOTIFICATIONS,
      fallbackError:
        "Could not load notifications. Run supabase/migrate-notifications.sql in Supabase.",
    },
  );
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(
        `notifications-list:${user.id}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          void load({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, load]);

  async function handleOpen(notification: Notification) {
    if (!notification.read) {
      try {
        await markRead(notification.id);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
      } catch {
        // Still navigate even if mark-read fails.
      }
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (err) {
      setError(getErrorMessage(err, "Could not mark notifications as read."));
    } finally {
      setMarkingAll(false);
    }
  }

  if (userLoading || loading) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card px-4">
        <Loader variant="notifications" count={6} />
      </div>
    );
  }

  if (!user) {
    return (
      <Empty className="border bg-card py-16">
        <EmptyContent>
          <EmptyTitle>Sign in to see notifications</EmptyTitle>
          <EmptyDescription>
            Likes, comments, and messages will show up here.
          </EmptyDescription>
          <Button size="sm" asChild>
            <Link href="/login?next=/notifications">Sign in</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const hasUnread = items.some((item) => !item.read);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {error && (
        <Alert variant="error" className="m-4 w-auto max-w-none">
          <AlertContent>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {!error && items.length > 0 && hasUnread && (
        <div className="flex justify-end border-b px-4 py-2 sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={markingAll}
            onClick={() => void handleMarkAllRead()}
          >
            Mark all as read
          </Button>
        </div>
      )}

      {!error && items.length === 0 && (
        <Empty className="border-0 py-16">
          <EmptyContent>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>
              When someone likes, comments, or messages you, it will appear here.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      <div className="divide-y">
        {items.map((notification) => {
          const Icon = iconMap[notification.type] ?? MessageCircle;
          const href = notificationHref(notification);

          return (
            <Link
              key={notification.id}
              href={href}
              onClick={() => void handleOpen(notification)}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5",
                !notification.read && "bg-primary/5",
              )}
            >
              {notification.user ? (
                <UserAvatar
                  src={notification.user.avatar}
                  name={notification.user.name}
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base leading-relaxed">
                  {notification.user && (
                    <span className="font-semibold">
                      {notification.user.name}{" "}
                    </span>
                  )}
                  {notification.message}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {notification.createdAt}
                </p>
              </div>
              {!notification.read && (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
