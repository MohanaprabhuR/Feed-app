import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsListSkeleton } from "@/components/skeletons";

export default function PrivacyLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Privacy" backHref="/settings" />
      <div className="px-4">
        <SettingsListSkeleton rows={5} />
      </div>
    </AppShell>
  );
}
