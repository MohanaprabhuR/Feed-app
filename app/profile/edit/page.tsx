"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

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
        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="size-32 rounded-full" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-[540px] w-full rounded-2xl" />
        </div>
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
