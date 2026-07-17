/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { ArticleCard } from "@/components/article-card";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
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
import {
  pageColumnClass,
  pageErrorClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { fetchSavedPosts } from "@/lib/saves";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SavedPostsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const data = await withMinimumDelay(
        fetchSavedPosts(supabase, user.id),
        PAGE_LOAD_MIN_DELAY_MS,
      );
      setPosts(data);
    } catch (err) {
      setPosts([]);
      setError(getErrorMessage(err, "Could not load saved posts."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const showLoading = userLoading || loading;

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Saved Posts" backHref="/feed" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        {showLoading && <FeedListSkeleton count={3} />}

        {!showLoading && !user && (
          <Empty className="border bg-card py-16">
            <EmptyContent>
              <EmptyTitle>Sign in to see saved posts</EmptyTitle>
              <EmptyDescription>
                Bookmark posts from the feed, then find them here.
              </EmptyDescription>
              <Button size="sm" asChild>
                <Link href="/login?next=/saved">Sign in</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!showLoading && user && error && (
          <div className={pageErrorClass}>
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadSaved()}
            >
              Try again
            </Button>
          </div>
        )}

        {!showLoading && user && !error && posts.length === 0 && (
          <Empty className="border bg-card py-16">
            <EmptyContent>
              <EmptyTitle>No saved posts yet</EmptyTitle>
              <EmptyDescription>
                Use Save post on any feed item to bookmark it here.
              </EmptyDescription>
              <Button size="sm" asChild>
                <Link href="/feed">Browse feed</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!showLoading &&
          user &&
          !error &&
          posts.map((post, index) => {
            const revealDelay = Math.min(index * 60, 300);
            const isOwnPost = user.id === post.author.id;
            const removePost = (postId: string) => {
              setPosts((current) => current.filter((p) => p.id !== postId));
            };
            const updatePostInList = (updated: Post) => {
              setPosts((current) =>
                current.map((p) =>
                  p.id === updated.id ? { ...p, ...updated } : p,
                ),
              );
            };

            return isArticle(post) ? (
              <ArticleCard
                key={post.id}
                post={post}
                showActions
                canManage={isOwnPost}
                onUpdated={updatePostInList}
                onDeleted={removePost}
                onUnsaved={removePost}
              />
            ) : (
              <PostCard
                key={post.id}
                post={post}
                showActions
                canManage={isOwnPost}
                revealDelay={revealDelay}
                onUpdated={updatePostInList}
                onDeleted={removePost}
                onUnsaved={removePost}
              />
            );
          })}
      </div>
    </AppShell>
  );
}
