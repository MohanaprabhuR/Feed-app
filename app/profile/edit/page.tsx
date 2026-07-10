"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileEditPage() {
  const { user, loading } = useCurrentUser();

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Edit profile" backHref="/profile" />
      <div className="mx-auto max-w-2xl p-4">
        {loading || !user ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <ProfileView userId={user.id} initialMode="edit" />
        )}
      </div>
    </AppShell>
  );
}
