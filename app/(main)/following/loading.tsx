import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  pageColumnClass,
  pageListClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export default function FollowingLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Network" backHref="/profile" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className={cn(pageListClass, "px-4")}>
          <UserListSkeleton count={5} />
        </div>
      </div>
    </AppShell>
  );
}
