"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSettingsPage() {
  const { user, loading } = useCurrentUser();

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Settings" backHref="/profile" />
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-5 sm:py-6">
        {loading || !user ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <ProfileView userId={user.id} initialMode="general" />
        )}
      </div>
    </AppShell>
  );
}
