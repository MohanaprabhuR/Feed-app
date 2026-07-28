/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { FeedListSkeleton } from "@/components/skeletons";
import { isArticle } from "@/lib/articles";
import { getErrorMessage } from "@/lib/errors";
import {
  PAGE_LOAD_MIN_DELAY_MS,
  withMinimumDelay,
} from "@/lib/minimum-delay";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

type FeedPostsProps = {
  initialPosts?: Post[];
  serverLoaded?: boolean;
  editPostId?: string | null;
  initialArticleOpen?: boolean;
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

export function FeedPosts({
  initialPosts = [],
  serverLoaded = false,
  editPostId = null,
  initialArticleOpen = false,
}: FeedPostsProps) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(!serverLoaded);
  const [error, setError] = useState<string | null>(null);

  const clearEditParam = useCallback(() => {
    if (!editPostId) return;
    router.replace(pathname);
  }, [editPostId, pathname, router]);

  const clearArticleParam = useCallback(() => {
    if (!initialArticleOpen) return;
    router.replace(pathname);
  }, [initialArticleOpen, pathname, router]);

  const loadPosts = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? false;
    if (showLoading) setLoading(true);

    try {
      const data = showLoading
        ? await withMinimumDelay(loadFeedPosts(), PAGE_LOAD_MIN_DELAY_MS)
        : await loadFeedPosts();
      setPosts(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load posts."));
    } finally {
      if (showLoading) setLoading(false);
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
    if (serverLoaded) return;
    void loadPosts({ showLoading: true });
  }, [serverLoaded, loadPosts]);

  // Live feed: when anyone else publishes a post, refetch so it appears
  // without a manual refresh. The current user's own post is already added
  // optimistically by handlePosted, so skip those events.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`feed-posts:${Date.now()}:${Math.random().toString(16).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const authorId = (payload.new as { author_id?: string } | null)
            ?.author_id;
          if (authorId && authorId === user?.id) return;
          void loadPosts();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loadPosts]);

  return (
    <div className="min-w-0 space-y-3">
      {user ? (
        <CreatePostComposer
          onPosted={handlePosted}
          initialArticleOpen={initialArticleOpen}
          onArticleClose={clearArticleParam}
        />
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

      {loading && <FeedListSkeleton count={3} />}

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

      {!loading &&
        posts.map((post, index) => {
        const isOwnPost = Boolean(user?.id && user.id === post.author.id);
        const revealDelay = Math.min(index * 60, 300);
        const removePost = (postId: string) => {
          setPosts((current) => current.filter((p) => p.id !== postId));
        };
        const updatePostInList = (updated: Post) => {
          setPosts((current) =>
            current.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
          );
        };

        const card = isArticle(post) ? (
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
            revealDelay={revealDelay}
            initialEditOpen={isOwnPost && editPostId === post.id}
            onEditClose={clearEditParam}
            onUpdated={updatePostInList}
            onDeleted={(postId) => {
              removePost(postId);
              clearEditParam();
            }}
          />
        );

        return card;
      })}
    </div>
  );
}
