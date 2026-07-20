"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { ProfileEditSkeleton } from "@/components/skeletons";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  return (
    <AppShell
      wide
      shellClassName="bg-gradient-to-b from-[#faf8f5] to-[#f3f3f3] dark:from-background dark:to-background"
      className="max-w-5xl px-4 py-8 sm:px-8 sm:py-10"
    >
      {loading || !user ? (
        <ProfileEditSkeleton />
      ) : (
        <ProfileEditForm
          user={user}
          onCancel={() => router.push("/profile")}
          onSaved={() => router.push("/profile")}
        />
      )}
    </AppShell>
  );
}
