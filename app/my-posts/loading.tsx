import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { FeedListSkeleton } from "@/components/skeletons";

export default function MyPostsLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="My Posts" backHref="/profile" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-5">
        <FeedListSkeleton count={3} />
      </div>
    </AppShell>
  );
}
