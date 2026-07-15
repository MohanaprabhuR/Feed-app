import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NotificationListSkeleton } from "@/components/skeletons";
import { pageColumnClass } from "@/lib/feed-layout";

export default function NotificationsLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Notifications" backHref="/feed" />
      <div className={pageColumnClass}>
        <div className="overflow-hidden rounded-xl border bg-card px-4">
          <NotificationListSkeleton count={6} />
        </div>
      </div>
    </AppShell>
  );
}
