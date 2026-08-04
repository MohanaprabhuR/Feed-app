import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileSkeleton } from "@/components/skeletons";

export default function ProfileSettingsLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Settings" backHref="/profile" />
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-5 sm:py-6">
        <ProfileSkeleton />
      </div>
    </AppShell>
  );
}
