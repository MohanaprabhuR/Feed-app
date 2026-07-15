import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { FeedListSkeleton } from "@/components/skeletons";
import { pageColumnClass, pageStackClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export default function MyPostsLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="My Posts" backHref="/profile" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        <FeedListSkeleton count={3} />
      </div>
    </AppShell>
  );
}
