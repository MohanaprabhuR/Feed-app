/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { CreatePostComposer } from "@/components/create-post-composer";
import { useCurrentUser } from "@/components/current-user-provider";
import { PostCard } from "@/components/post-card";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
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
import { getErrorMessage } from "@/lib/errors";
import type { Post } from "@/lib/types";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

type FeedPostsProps = {
  initialPosts?: Post[];
};

async function loadFeedPosts(): Promise<Post[]> {
  const response = await fetch("/api/posts", {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    posts?: Post[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Could not load posts.");
  }

  return payload.posts ?? [];
}

export function FeedPosts({ initialPosts = [] }: FeedPostsProps) {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editPostId = searchParams.get("edit");
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const clearEditParam = useCallback(() => {
    if (!searchParams.has("edit")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const loadPosts = useCallback(async () => {
    try {
      const data = await loadFeedPosts();
      setPosts(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load posts."));
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
    [loadPosts],
  );

  useEffect(() => {
    void loadPosts();

    const timer = window.setInterval(() => {
      void loadPosts();
    }, 30_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadPosts();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadPosts, userId]);

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
          <AlertContent>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
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

      {posts.map((post) => {
        const isOwnPost = Boolean(user?.id && user.id === post.author.id);
        const removePost = (postId: string) => {
          setPosts((current) => current.filter((p) => p.id !== postId));
        };
        const updatePostInList = (updated: Post) => {
          setPosts((current) =>
            current.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
          );
        };

        return isArticle(post) ? (
          <ArticleCard
            key={post.id}
            post={post}
            showActions
            canManage={isOwnPost}
            initialEditOpen={isOwnPost && editPostId === post.id}
            onEditClose={clearEditParam}
            onUpdated={updatePostInList}
            onDeleted={(postId) => {
              removePost(postId);
              clearEditParam();
            }}
          />
        ) : (
          <PostCard
            key={post.id}
            post={post}
            showActions
            canManage={isOwnPost}
            initialEditOpen={isOwnPost && editPostId === post.id}
            onEditClose={clearEditParam}
            onUpdated={updatePostInList}
            onDeleted={(postId) => {
              removePost(postId);
              clearEditParam();
            }}
          />
        );
      })}
    </div>
  );
}
