"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Profile" backHref="/feed" />
      <div className="mx-auto max-w-2xl p-4">
        <ProfileView userId={id} initialMode="view" />
      </div>
    </AppShell>
  );
}
