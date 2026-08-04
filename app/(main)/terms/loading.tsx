import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TextBlockSkeleton } from "@/components/skeletons";

export default function TermsLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Legal" backHref="/settings" />
      <div className="px-4 py-5 sm:px-5 sm:py-6">
        <TextBlockSkeleton lines={8} />
      </div>
    </AppShell>
  );
}
