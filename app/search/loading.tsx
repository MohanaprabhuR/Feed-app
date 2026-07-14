import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Search" backHref="/feed" />
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <UserListSkeleton count={4} />
      </div>
    </AppShell>
  );
}
