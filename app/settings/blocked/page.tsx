"use client";

import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { Button } from "@/components/ui/button";
import { blockedUsers } from "@/lib/mock-data";

export default function BlockedUsersPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Blocked Users" backHref="/settings" />
      <div className="divide-y px-4">
        {blockedUsers.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success(`Unblocked @${user.username}`)}
              >
                Unblock
              </Button>
            }
          />
        ))}
        {blockedUsers.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No blocked users
          </p>
        )}
      </div>
    </AppShell>
  );
}
