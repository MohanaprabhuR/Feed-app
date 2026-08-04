import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { pageColumnClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export default function SettingsLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Settings" backHref="/feed" />
      <div className={cn(pageColumnClass, "space-y-6")}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="mx-1 h-3.5 w-28" />
            <SettingsListSkeleton rows={3} className="px-4" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
