import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListSkeleton } from "@/components/skeletons";

export default function BlockedLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Blocked Users" backHref="/settings" />
      <div className="divide-y px-4">
        <UserListSkeleton count={4} />
      </div>
    </AppShell>
  );
}
