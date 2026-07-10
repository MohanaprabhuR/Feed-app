"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { CreatePostComposer } from "@/components/create-post-composer";
import { useCurrentUser } from "@/components/current-user-provider";
import { PostCard } from "@/components/post-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { isArticle } from "@/lib/articles";
import { fetchPosts } from "@/lib/posts";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

type FeedPostsProps = {
  initialPosts?: Post[];
};

export function FeedPosts({ initialPosts = [] }: FeedPostsProps) {
  const { user } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      const supabase = createClient();
      const data = await fetchPosts(supabase);
      setPosts(data);
      setError(null);
    } catch (error) {
      setError(getErrorMessage(error, "Could not load posts."));
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePosted = useCallback(
    (newPost?: Post) => {
      if (newPost) {
        setPosts((current) => {
          if (current.some((post) => post.id === newPost.id)) {
            return current;
          }
          return [newPost, ...current];
        });
      }
      void loadPosts();
    },
    [loadPosts]
  );

  useEffect(() => {
    void loadPosts();

    const supabase = createClient();

    const channel = supabase
      .channel("feed-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          void loadPosts();
        }
      )
      .subscribe();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadPosts();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadPosts]);

  return (
    <div className="min-w-0 space-y-3">
      {user ? (
        <CreatePostComposer onPosted={handlePosted} />
      ) : (
        <Card padding="none" className={feedCardClass}>
          <CardContent className={cn(feedCardSectionClass, "text-center")}>
            <Empty>
              <EmptyContent>
                <EmptyTitle>Join the conversation</EmptyTitle>
                <EmptyDescription>
                  Sign in to share a post with everyone on the feed.
                </EmptyDescription>
                <Button asChild size="sm">
                  <Link href="/login?next=/feed">Sign in</Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}

      {error && (
        <Alert variant="error" className="w-full max-w-none">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && posts.length === 0 && (
        <Empty className="border">
          <EmptyContent>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              Be the first to share something on the feed.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      {posts.map((post) =>
        isArticle(post) ? (
          <ArticleCard
            key={post.id}
            post={post}
            showActions={user?.id === post.author.id}
          />
        ) : (
          <PostCard
            key={post.id}
            post={post}
            showActions={user?.id === post.author.id}
          />
        )
      )}
    </div>
  );
}
