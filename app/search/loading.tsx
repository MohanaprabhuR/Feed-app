import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { UserListSkeleton } from "@/components/skeletons";
import { pageColumnClass, pageListClass, pageStackClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export default function SearchLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Search" backHref="/feed" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className={cn(pageListClass, "px-4")}>
          <UserListSkeleton count={4} />
        </div>
      </div>
    </AppShell>
  );
}
