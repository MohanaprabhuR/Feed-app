import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { FeedLeftSidebar } from "@/components/feed-left-sidebar";
import { FeedRightSidebar } from "@/components/feed-right-sidebar";
import { FeedPosts } from "@/components/feed-posts";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-6">
        <div className="hidden lg:block">
          <div className="sticky top-[72px]">
            <FeedLeftSidebar />
          </div>
        </div>

        <Suspense
          fallback={
            <div className="min-w-0 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          }
        >
          <FeedPosts initialPosts={initialPosts} />
        </Suspense>

        <div className="hidden lg:block">
          <div className="sticky top-[72px]">
            <FeedRightSidebar initialSuggestedUsers={initialSuggestedUsers} />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4 lg:hidden">
        <FeedLeftSidebar />
        <FeedRightSidebar initialSuggestedUsers={initialSuggestedUsers} />
      </div>
    </AppShell>
  );
}
