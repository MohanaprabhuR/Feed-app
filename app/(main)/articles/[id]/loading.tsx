import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ArticleCardSkeleton } from "@/components/skeletons";

export default function ArticleLoading() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Article" backHref="/feed" />
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        <ArticleCardSkeleton />
      </div>
    </AppShell>
  );
}
