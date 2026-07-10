import { AppShell } from "@/components/app-shell";
import { FeedLeftSidebar } from "@/components/feed-left-sidebar";
import { FeedPosts } from "@/components/feed-posts";
import { FeedRightSidebar } from "@/components/feed-right-sidebar";
import { fetchPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

export default async function FeedPage() {
  let initialPosts: Post[] = [];

  try {
    const supabase = await createClient();
    initialPosts = await fetchPosts(supabase);
  } catch {
    initialPosts = [];
  }

  return (
    <AppShell feedLayout>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[225px_minmax(0,1fr)_300px]">
        <div className="hidden lg:block">
          <div className="sticky top-[68px]">
            <FeedLeftSidebar />
          </div>
        </div>

        <FeedPosts initialPosts={initialPosts} />

        <div className="hidden lg:block">
          <div className="sticky top-[68px]">
            <FeedRightSidebar />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 lg:hidden">
        <FeedLeftSidebar />
        <FeedRightSidebar />
      </div>
    </AppShell>
  );
}
