"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";
import { Loader } from "@/components/loader";
import { pageColumnClass } from "@/lib/feed-layout";

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();

  return (
    <AppShell noPadding feedLayout>
      <PageHeader
        title={user?.name ?? "Profile"}
        backHref="/feed"
      />
      <div className={pageColumnClass}>
        {loading || !user ? (
          <Loader variant="profile" />
        ) : (
          <ProfileView userId={user.id} initialMode="view" />
        )}
      </div>
    </AppShell>
  );
}
