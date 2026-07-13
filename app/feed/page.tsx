import { AppShell } from "@/components/app-shell";
import { FeedLeftSidebar } from "@/components/feed-left-sidebar";
import { FeedRightSidebar } from "@/components/feed-right-sidebar";
import { FeedPosts } from "@/components/feed-posts";
import { fetchPosts } from "@/lib/posts";
import { fetchSuggestedProfiles } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Post, User } from "@/lib/types";

export default async function FeedPage() {
  let initialPosts: Post[] = [];
  let initialSuggestedUsers: User[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [posts, suggestedUsers] = await Promise.all([
      fetchPosts(supabase, { userId: user?.id }),
      fetchSuggestedProfiles(supabase, {
        excludeUserId: user?.id,
        limit: 3,
      }),
    ]);

    initialPosts = posts;
    initialSuggestedUsers = suggestedUsers;
  } catch {
    initialPosts = [];
    initialSuggestedUsers = [];
  }

  return (
    <AppShell feedLayout>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-6">
        <div className="hidden lg:block">
          <div className="sticky top-[60px]">
            <FeedLeftSidebar />
          </div>
        </div>

        <FeedPosts initialPosts={initialPosts} />

        <div className="hidden lg:block">
          <div className="sticky top-[60px]">
            <FeedRightSidebar initialSuggestedUsers={initialSuggestedUsers} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 lg:hidden">
        <FeedLeftSidebar />
        <FeedRightSidebar initialSuggestedUsers={initialSuggestedUsers} />
      </div>
    </AppShell>
  );
}
