"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";
import { ProfileSkeleton } from "@/components/skeletons";

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();

  return (
    <AppShell noPadding feedLayout>
      <PageHeader
        title={user?.name ?? "Profile"}
        backHref="/feed"
      />
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-5 sm:py-6">
        {loading || !user ? (
          <ProfileSkeleton />
        ) : (
          <ProfileView userId={user.id} initialMode="view" />
        )}
      </div>
    </AppShell>
  );
}
