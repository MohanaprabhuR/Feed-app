"use client";

import Link from "next/link";
import { useCurrentUser } from "@/components/current-user-provider";
import { AppShell } from "@/components/app-shell";
import { ArticleCard } from "@/components/article-card";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { isArticle } from "@/lib/articles";
import { usePageLoad } from "@/hooks/use-page-load";
import {
  pageColumnClass,
  pageErrorClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { fetchPostsByAuthor } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_POSTS: Post[] = [];

export default function MyPostsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const signedIn = Boolean(user);
  const {
    data: posts,
    setData: setPosts,
    loading,
    error,
    reload: loadPosts,
  } = usePageLoad(
    async () => {
      const supabase = createClient();
      return fetchPostsByAuthor(supabase, user!.id, { userId: user!.id });
    },
    [user?.id],
    {
      enabled: signedIn,
      initialData: EMPTY_POSTS,
      fallbackError: "Could not load your posts.",
    },
  );

  const showLoading = userLoading || loading;

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="My Posts" backHref="/profile" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        {showLoading && <Loader variant="posts" count={3} />}

        {!showLoading && error && (
          <div className={pageErrorClass}>
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadPosts()}
            >
              Try again
            </Button>
          </div>
        )}

        {!showLoading && !error && posts.length === 0 && (
          <Empty className="border bg-card py-16">
            <EmptyContent>
              <EmptyTitle>No posts yet</EmptyTitle>
              <EmptyDescription>
                Everything you share on the feed will show up here.
              </EmptyDescription>
              <Button size="sm" asChild>
                <Link href="/feed">Create a post</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!showLoading &&
          !error &&
          posts.map((post, index) => {
            const revealDelay = Math.min(index * 60, 300);
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
                canManage
                onUpdated={updatePostInList}
                onDeleted={removePost}
              />
            ) : (
              <PostCard
                key={post.id}
                post={post}
                showActions
                canManage
                revealDelay={revealDelay}
                onUpdated={updatePostInList}
                onDeleted={removePost}
              />
            );
          })}
      </div>
    </AppShell>
  );
}
