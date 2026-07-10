import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { users } from "@/lib/mock-data";

export default function FollowingPage() {
  const following = users.filter((u) => u.isFollowing);

  return (
    <AppShell noPadding>
      <PageHeader title="Following" backHref="/feed" />
      <div className="divide-y px-4">
        {following.map((user) => (
          <UserListItem key={user.id} user={user} />
        ))}
      </div>
    </AppShell>
  );
}
