import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeTime } from "@/lib/posts";
import { profileToUser, type ProfileRow } from "@/lib/profile";
import type { Notification } from "@/lib/types";

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: Notification["type"];
  message: string;
  post_id: string | null;
  comment_id: string | null;
  conversation_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: ProfileRow | ProfileRow[] | null;
};

function actorFromJoin(
  actor: ProfileRow | ProfileRow[] | null | undefined,
): ProfileRow | null {
  if (!actor) return null;
  return Array.isArray(actor) ? (actor[0] ?? null) : actor;
}

export function notificationRowToNotification(
  row: NotificationRow,
): Notification {
  const actor = actorFromJoin(row.actor);
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    user: actor ? profileToUser(actor) : undefined,
    postId: row.post_id ?? undefined,
    commentId: row.comment_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    createdAt: formatRelativeTime(row.created_at),
    read: Boolean(row.read_at),
  };
}

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number },
): Promise<Notification[]> {
  const limit = options?.limit ?? 50;

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      recipient_id,
      actor_id,
      type,
      message,
      post_id,
      comment_id,
      conversation_id,
      read_at,
      created_at,
      actor:profiles!actor_id (
        id,
        name,
        username,
        email,
        bio,
        avatar,
        followers_count,
        following_count,
        posts_count
      )
    `,
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    const lower = error.message.toLowerCase();
    if (
      lower.includes("notifications") &&
      (lower.includes("schema cache") ||
        lower.includes("does not exist") ||
        lower.includes("could not find") ||
        lower.includes("relation"))
    ) {
      throw new Error(
        "Notifications need database setup. Run supabase/migrate-notifications.sql in Supabase → SQL Editor.",
      );
    }
    throw error;
  }

  return ((data ?? []) as NotificationRow[]).map(notificationRowToNotification);
}

export async function fetchUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) throw error;
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) throw error;
}

export function notificationHref(notification: Notification): string {
  if (notification.type === "message" && notification.conversationId) {
    return `/messages?c=${notification.conversationId}`;
  }
  if (notification.type === "comment" && notification.postId) {
    return `/post/${notification.postId}/comments`;
  }
  if (notification.type === "like" && notification.postId) {
    return `/post/${notification.postId}/likes`;
  }
  if (notification.postId) {
    return `/post/${notification.postId}/comments`;
  }
  return "/notifications";
}
