import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "@/lib/types";

const TITLES: Record<Notification["type"], string> = {
  like: "New reaction",
  comment: "New comment",
  message: "New message",
  follow: "New follower",
  mention: "New mention",
  system: "FeedApp",
  event: "New event",
};

export function canRequestNotificationPermission() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission() {
  if (!canRequestNotificationPermission()) return;
  if (Notification.permission !== "default") return;

  try {
    await Notification.requestPermission();
  } catch {
    // Ignore — some browsers reject if not called from a user gesture.
  }
}

/** Foreground-only: fires while this tab is open, using the existing realtime subscription. */
export function showBrowserNotification(
  type: Notification["type"],
  message: string,
) {
  if (!canRequestNotificationPermission()) return;
  if (Notification.permission !== "granted") return;

  new Notification(TITLES[type] ?? "FeedApp", {
    body: message,
    icon: "/favicon.ico",
    tag: `feed-app-notification-${type}`,
  });
}

/**
 * Builds the notification body the same way the in-app list does — actor's
 * name prepended to the row's message (e.g. "liked your post" becomes
 * "PrabhuDhivya R liked your post") — then shows it. The realtime payload
 * only carries raw columns, so the actor's name needs a lookup.
 */
export async function notifyFromNotificationRow(
  supabase: SupabaseClient,
  row: {
    type: Notification["type"];
    message: string;
    actor_id: string | null;
  },
) {
  if (!canRequestNotificationPermission()) return;
  if (Notification.permission !== "granted") return;

  let actorName: string | null = null;
  if (row.actor_id) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", row.actor_id)
      .maybeSingle();
    actorName = data?.name ?? null;
  }

  showBrowserNotification(
    row.type,
    actorName ? `${actorName} ${row.message}` : row.message,
  );
}
