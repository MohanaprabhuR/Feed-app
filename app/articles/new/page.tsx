import { AppShell } from "@/components/app-shell";
import { ArticleEditor } from "@/components/article-editor";
import { PageHeader } from "@/components/page-header";

export default function NewArticlePage() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Write article" backHref="/feed" />
      <ArticleEditor />
    </AppShell>
  );
}
