import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ArticleView } from "@/components/article-view";
import { PageHeader } from "@/components/page-header";
import { fetchPostById } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const article = await fetchPostById(supabase, id);

  if (!article || article.type !== "article") {
    notFound();
  }

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Article" backHref="/feed" />
      <ArticleView article={article} />
    </AppShell>
  );
}
