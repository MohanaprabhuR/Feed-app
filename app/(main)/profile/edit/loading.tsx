import { AppShell } from "@/components/app-shell";
import { ProfileEditSkeleton } from "@/components/skeletons";

export default function ProfileEditLoading() {
  return (
    <AppShell
      wide
      shellClassName="bg-gradient-to-b from-[#faf8f5] to-[#f3f3f3] dark:from-background dark:to-background"
      className="max-w-5xl px-4 py-8 sm:px-8 sm:py-10"
    >
      <ProfileEditSkeleton />
    </AppShell>
  );
}
