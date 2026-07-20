import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CommentListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommentsLoading() {
  return (
    <AppShell noPadding className="flex flex-col">
      <PageHeader title="Comments" backHref="/feed" />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <CommentListSkeleton count={4} />
      </div>
      <div className="sticky bottom-16 z-10 border-t bg-background p-4 md:bottom-0">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </AppShell>
  );
}
