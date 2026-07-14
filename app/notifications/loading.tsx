import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NotificationListSkeleton } from "@/components/skeletons";

export default function NotificationsLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Notifications" backHref="/feed" />
      <NotificationListSkeleton count={6} />
    </AppShell>
  );
}
