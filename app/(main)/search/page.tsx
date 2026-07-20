"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/components/current-user-provider";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { UserListItem } from "@/components/user-list-item";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedListSkeleton, UserListSkeleton } from "@/components/skeletons";
import { getErrorMessage } from "@/lib/errors";
import {
  pageColumnClass,
  pageListClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { searchProfiles } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { Post, User } from "@/lib/types";
import { cn } from "@/lib/utils";

async function searchFeedPosts(query: string): Promise<Post[]> {
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

  const posts = payload.posts ?? [];
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return posts;

  return posts.filter((post) => {
    const content = post.content?.toLowerCase() ?? "";
    const authorName = post.author?.name?.toLowerCase() ?? "";
    const authorUsername = post.author?.username?.toLowerCase() ?? "";
    return (
      content.includes(trimmed) ||
      authorName.includes(trimmed) ||
      authorUsername.includes(trimmed)
    );
  });
}

export default function SearchPage() {
  const { user } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadResults = useCallback(async () => {
    setLoadingUsers(true);
    setLoadingPosts(true);
    setError(null);

    try {
      const supabase = createClient();
      const [matchedUsers, matchedPosts] = await Promise.all([
        searchProfiles(supabase, debouncedQuery, {
          excludeUserId: user?.id,
          limit: 40,
        }),
        searchFeedPosts(debouncedQuery),
      ]);
      setUsers(matchedUsers);
      setPosts(matchedPosts);
    } catch (err) {
      setUsers([]);
      setPosts([]);
      setError(getErrorMessage(err, "Could not search."));
    } finally {
      setLoadingUsers(false);
      setLoadingPosts(false);
    }
  }, [debouncedQuery, user]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const showUsersLoading = loadingUsers;
  const showPostsLoading = loadingPosts;

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Search" backHref="/feed" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        <Input
          type="search"
          size="lg"
          variant="outline"
          placeholder="Search users, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={<Search className="size-4 text-muted-foreground" />}
        />

        {error ? (
          <p className="px-1 text-sm text-destructive">{error}</p>
        ) : null}

        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex-1">
              Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-6">
            {!debouncedQuery ? (
              <Empty className="border bg-card py-14">
                <EmptyContent>
                  <EmptyTitle>Search Feed</EmptyTitle>
                  <EmptyDescription>
                    Find registered people and posts by name, username, or
                    keywords.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="px-1 text-sm font-medium text-muted-foreground">
                    Users
                  </h3>
                  {showUsersLoading ? (
                    <div className={cn(pageListClass, "px-4")}>
                      <UserListSkeleton count={3} />
                    </div>
                  ) : users.length > 0 ? (
                    <div className={cn(pageListClass, "px-4")}>
                      {users.map((matchedUser) => (
                        <UserListItem key={matchedUser.id} user={matchedUser} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 text-sm text-muted-foreground">
                      No users matched.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="px-1 text-sm font-medium text-muted-foreground">
                    Posts
                  </h3>
                  {showPostsLoading ? (
                    <FeedListSkeleton count={2} />
                  ) : posts.length > 0 ? (
                    <div className={pageStackClass}>
                      {posts.map((post, index) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          revealDelay={Math.min(index * 60, 300)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 text-sm text-muted-foreground">
                      No posts matched.
                    </p>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {showUsersLoading ? (
              <div className={cn(pageListClass, "px-4")}>
                <UserListSkeleton count={5} />
              </div>
            ) : users.length > 0 ? (
              <div className={cn(pageListClass, "px-4")}>
                {users.map((matchedUser) => (
                  <UserListItem key={matchedUser.id} user={matchedUser} />
                ))}
              </div>
            ) : (
              <Empty className="border bg-card py-14">
                <EmptyContent>
                  <EmptyTitle>No users found</EmptyTitle>
                  <EmptyDescription>
                    {debouncedQuery
                      ? "Try a different name or username."
                      : "No registered users yet."}
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {showPostsLoading ? (
              <FeedListSkeleton count={3} />
            ) : posts.length > 0 ? (
              posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  revealDelay={Math.min(index * 60, 300)}
                />
              ))
            ) : (
              <Empty className="border bg-card py-14">
                <EmptyContent>
                  <EmptyTitle>No posts found</EmptyTitle>
                  <EmptyDescription>
                    {debouncedQuery
                      ? "Try different keywords."
                      : "No posts yet."}
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </TabsContent>
        </Tabs>

        <Link
          href="/trending"
          className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          View trending topics →
        </Link>
      </div>
    </AppShell>
  );
}
