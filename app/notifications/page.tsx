import Link from "next/link";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { notifications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: MessageCircle,
  system: MessageCircle,
};

export default function NotificationsPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Notifications" backHref="/feed" />
      <div className="divide-y">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type];
          return (
            <Link
              key={notification.id}
              href={notification.postId ? `/post/${notification.postId}/comments` : "/feed"}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                !notification.read && "bg-primary/5"
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
                <p className="text-sm">
                  {notification.user && (
                    <span className="font-medium">{notification.user.name} </span>
                  )}
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
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
    </AppShell>
  );
}
