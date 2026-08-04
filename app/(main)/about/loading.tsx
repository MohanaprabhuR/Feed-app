import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TextBlockSkeleton } from "@/components/skeletons";

export default function AboutLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="About" backHref="/settings" />
      <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
        <TextBlockSkeleton lines={7} />
      </div>
    </AppShell>
  );
}
