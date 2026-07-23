import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MediaGalleryLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Media Gallery" backHref="/feed" />
      <div className="grid grid-cols-3 gap-1 p-1">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-none" />
        ))}
      </div>
    </AppShell>
  );
}
