import { AppShell } from "@/components/app-shell";
import {
  FeedListSkeleton,
  SidebarLeftSkeleton,
  SidebarSuggestedSkeleton,
} from "@/components/skeletons";

export default function FeedLoading() {
  return (
    <AppShell feedLayout>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-6">
        <div className="hidden lg:block">
          <div className="sticky top-18">
            <SidebarLeftSkeleton />
          </div>
        </div>
        <FeedListSkeleton count={3} withComposer />
        <div className="hidden lg:block">
          <div className="sticky top-18">
            <SidebarSuggestedSkeleton />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
