import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { users } from "@/lib/mock-data";

export default function FollowersPage() {
  const followers = users.filter((u) => u.id !== "me");

  return (
    <AppShell noPadding>
      <PageHeader title="Followers" backHref="/feed" />
      <div className="divide-y px-4">
        {followers.map((user) => (
          <UserListItem key={user.id} user={user} />
        ))}
      </div>
    </AppShell>
  );
}
