import { AppShell } from "@/components/app-shell";
import { FeedLeftSidebar } from "@/components/feed-left-sidebar";
import { FeedListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { feedCardClass, feedCardTitleClass } from "@/lib/feed-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function FeedLoading() {
  return (
    <AppShell feedLayout>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-6">
        <div className="hidden lg:block">
          <div className="sticky top-[72px]">
            <FeedLeftSidebar />
          </div>
        </div>
        <FeedListSkeleton count={3} withComposer />
        <div className="hidden lg:block">
          <div className="sticky top-[72px]">
            <Card padding="none" className={feedCardClass}>
              <CardHeader className={feedCardTitleClass}>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
