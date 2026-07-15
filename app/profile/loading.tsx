import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileSkeleton } from "@/components/skeletons";
import { pageColumnClass } from "@/lib/feed-layout";

export default function ProfileLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Profile" backHref="/feed" />
      <div className={pageColumnClass}>
        <ProfileSkeleton />
      </div>
    </AppShell>
  );
}
