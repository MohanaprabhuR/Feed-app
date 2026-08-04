import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsListSkeleton } from "@/components/skeletons";

export default function LanguageLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Language" backHref="/settings" />
      <div className="px-4">
        <SettingsListSkeleton rows={6} />
      </div>
    </AppShell>
  );
}
