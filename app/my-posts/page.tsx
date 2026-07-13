"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPostsByAuthor } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";

export default function MyPostsPage() {
  const { user } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const data = await fetchPostsByAuthor(supabase, user.id, {
        userId: user.id,
      });
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <AppShell noPadding>
      <PageHeader title="My Posts" backHref="/feed" />
      <div className="space-y-4 p-4">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}

        {!loading && posts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            You haven&apos;t posted anything yet.
          </p>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} showActions />
        ))}
      </div>
    </AppShell>
  );
}
