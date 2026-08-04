import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { FormPageSkeleton } from "@/components/skeletons";

export default function ReportLoading() {
  return (
    <AppShell noPadding>
      <PageHeader title="Report Post" backHref="/feed" />
      <div className="space-y-6 p-4">
        <FormPageSkeleton />
      </div>
    </AppShell>
  );
}
