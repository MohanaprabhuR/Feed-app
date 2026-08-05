import { AppShell } from "@/components/app-shell";
import { FeedLeftSidebar } from "@/components/feed-left-sidebar";
import { FeedRightSidebar } from "@/components/feed-right-sidebar";
import { FeedPosts } from "@/components/feed-posts";
import { fetchPosts } from "@/lib/posts";
import { fetchSuggestedProfiles } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Post, User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; write?: string }>;
}) {
  const { edit: editPostId, write } = await searchParams;
  let initialPosts: Post[] = [];
  let initialSuggestedUsers: User[] = [];
  let serverLoaded = false;

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
    serverLoaded = true;
  } catch {
    initialPosts = [];
    initialSuggestedUsers = [];
  }

  return (
    <AppShell feedLayout>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-6">
        <div className="hidden lg:block">
          <div className="sticky top-18">
            <FeedLeftSidebar />
          </div>
        </div>

        <FeedPosts
          initialPosts={initialPosts}
          serverLoaded={serverLoaded}
          editPostId={editPostId ?? null}
          initialArticleOpen={write === "article"}
        />

        <div className="hidden lg:block">
          <div className="sticky top-18">
            <FeedRightSidebar initialSuggestedUsers={initialSuggestedUsers} />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4 lg:hidden">
        <FeedRightSidebar initialSuggestedUsers={initialSuggestedUsers} />
      </div>
    </AppShell>
  );
}
