import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { posts } from "@/lib/mock-data";

export default function SavedPostsPage() {
  const savedPosts = posts.filter((p) => p.isSaved);

  return (
    <AppShell noPadding>
      <PageHeader title="Saved Posts" backHref="/feed" />
      <div className="space-y-4 p-4">
        {savedPosts.length > 0 ? (
          savedPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            No saved posts yet
          </p>
        )}
      </div>
    </AppShell>
  );
}
