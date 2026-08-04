import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsListSkeleton } from "@/components/skeletons";
import { pageColumnClass } from "@/lib/feed-layout";

export default function ThemeLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Theme" backHref="/settings" />
      <div className={pageColumnClass}>
        <SettingsListSkeleton rows={3} />
      </div>
    </AppShell>
  );
}
