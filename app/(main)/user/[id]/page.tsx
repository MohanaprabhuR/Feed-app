"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";
import { pageColumnClass } from "@/lib/feed-layout";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Profile" backHref="/feed" />
      <div className={pageColumnClass}>
        <ProfileView userId={id} initialMode="view" />
      </div>
    </AppShell>
  );
}
