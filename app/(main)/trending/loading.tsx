import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrendingLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Trending" backHref="/search" />
      <div className="space-y-3 p-4 skeleton-stagger">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="size-6 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
