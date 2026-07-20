"use client";

import { AppShell } from "@/components/app-shell";
import { NotificationsList } from "@/components/notifications-list";
import { PageHeader } from "@/components/page-header";
import { pageColumnClass } from "@/lib/feed-layout";

export default function NotificationsPage() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Notifications" backHref="/feed" />
      <div className={pageColumnClass}>
        <NotificationsList />
      </div>
    </AppShell>
  );
}
