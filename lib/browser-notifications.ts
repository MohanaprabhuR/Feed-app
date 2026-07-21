import type { Notification } from "@/lib/types";

const TITLES: Record<Notification["type"], string> = {
  like: "New reaction",
  comment: "New comment",
  message: "New message",
  follow: "New follower",
  mention: "New mention",
  system: "FeedApp",
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
