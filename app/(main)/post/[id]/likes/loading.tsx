import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListSkeleton } from "@/components/skeletons";

export default function LikesLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Reactions" backHref="/feed" />
      <div className="px-4">
        <UserListSkeleton count={5} />
      </div>
    </AppShell>
  );
}
