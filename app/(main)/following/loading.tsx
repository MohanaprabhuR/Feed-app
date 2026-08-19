import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { UserListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  networkPageClass,
  pagePanelClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export default function FollowingLoading() {
  return (
    <AppShell noPadding feedLayout>
      <div className={networkPageClass}>
        <header className="mb-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[72px] rounded-xl" />
            <Skeleton className="h-[72px] rounded-xl" />
          </div>
        </header>

        <Skeleton className="mb-4 h-10 w-full rounded-lg" />

        <Card padding="none" className={cn(pagePanelClass, "min-h-[min(60vh,520px)]")}>
          <CardContent className="px-4 py-2 sm:px-5">
            <UserListSkeleton count={5} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
