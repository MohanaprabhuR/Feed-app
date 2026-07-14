import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { conversations } from "@/lib/mock-data";

export default function MessagesPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Messages" backHref="/feed" />
      <div className="divide-y">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5"
          >
            <UserAvatar src={conv.user.avatar} name={conv.user.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-base font-semibold">{conv.user.name}</p>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {conv.lastMessageAt}
                </span>
              </div>
              <p className="truncate text-base text-muted-foreground">
                {conv.lastMessage}
              </p>
            </div>
            {conv.unread > 0 && (
              <Badge className="shrink-0">{conv.unread}</Badge>
            )}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
