"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/components/current-user-provider";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { UserListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/errors";
import {
  pageColumnClass,
  pageErrorClass,
  pageListClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { fetchFollowers, fetchFollowing } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type NetworkTab = "following" | "followers";

function parseTab(value: string | null): NetworkTab {
  return value === "followers" ? "followers" : "following";
}

function FollowingPageContent() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [followingError, setFollowingError] = useState<string | null>(null);
  const [followersError, setFollowersError] = useState<string | null>(null);

  const loadFollowing = useCallback(async () => {
    if (!user) {
      setFollowing([]);
      setLoadingFollowing(false);
      return;
    }

    setLoadingFollowing(true);
    setFollowingError(null);

    try {
      const supabase = createClient();
      const data = await fetchFollowing(supabase, user.id);
      setFollowing(data);
    } catch (err) {
      setFollowing([]);
      setFollowingError(
        getErrorMessage(err, "Could not load people you follow."),
      );
    } finally {
      setLoadingFollowing(false);
    }
  }, [user]);

  const loadFollowers = useCallback(async () => {
    if (!user) {
      setFollowers([]);
      setLoadingFollowers(false);
      return;
    }

    setLoadingFollowers(true);
    setFollowersError(null);

    try {
      const supabase = createClient();
      const data = await fetchFollowers(supabase, user.id, {
        viewerId: user.id,
      });
      setFollowers(data);
    } catch (err) {
      setFollowers([]);
      setFollowersError(getErrorMessage(err, "Could not load followers."));
    } finally {
      setLoadingFollowers(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFollowing();
    void loadFollowers();
  }, [loadFollowing, loadFollowers]);

  function handleTabChange(value: string) {
    const tab = parseTab(value);
    router.replace(
      tab === "following" ? "/following" : "/following?tab=followers",
    );
  }

  const showAuthGate = !userLoading && !user;

  return (
    <div className={cn(pageColumnClass, pageStackClass)}>
      {showAuthGate ? (
        <Empty className="border bg-card py-16">
          <EmptyContent>
            <EmptyTitle>Sign in to see your network</EmptyTitle>
            <EmptyDescription>
              Following and followers will appear here after you sign in.
            </EmptyDescription>
            <Button size="sm" asChild>
              <Link href="/login?next=/following">Sign in</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="following" className="flex-1">
              Following
            </TabsTrigger>
            <TabsTrigger value="followers" className="flex-1">
              Followers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4">
            {(userLoading || loadingFollowing) && (
              <div className={cn(pageListClass, "px-4")}>
                <UserListSkeleton count={5} />
              </div>
            )}

            {!userLoading && !loadingFollowing && followingError && (
              <div className={pageErrorClass}>
                <p className="text-sm text-destructive">{followingError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void loadFollowing()}
                >
                  Try again
                </Button>
              </div>
            )}

            {!userLoading &&
              !loadingFollowing &&
              !followingError &&
              following.length === 0 && (
                <Empty className="border bg-card py-16">
                  <EmptyContent>
                    <EmptyTitle>Not following anyone yet</EmptyTitle>
                    <EmptyDescription>
                      Use Follow in “Add to your feed” or on a profile to add
                      people here.
                    </EmptyDescription>
                    <Button size="sm" asChild>
                      <Link href="/feed">Browse feed</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              )}

            {!userLoading &&
              !loadingFollowing &&
              !followingError &&
              following.length > 0 && (
                <div className={cn(pageListClass, "px-4")}>
                  {following.map((followedUser) => (
                    <UserListItem
                      key={followedUser.id}
                      user={followedUser}
                      onFollowChange={(userId, isFollowing) => {
                        if (!isFollowing) {
                          setFollowing((current) =>
                            current.filter((item) => item.id !== userId),
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4">
            {(userLoading || loadingFollowers) && (
              <div className={cn(pageListClass, "px-4")}>
                <UserListSkeleton count={5} />
              </div>
            )}

            {!userLoading && !loadingFollowers && followersError && (
              <div className={pageErrorClass}>
                <p className="text-sm text-destructive">{followersError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void loadFollowers()}
                >
                  Try again
                </Button>
              </div>
            )}

            {!userLoading &&
              !loadingFollowers &&
              !followersError &&
              followers.length === 0 && (
                <Empty className="border bg-card py-16">
                  <EmptyContent>
                    <EmptyTitle>No followers yet</EmptyTitle>
                    <EmptyDescription>
                      When someone follows you, they’ll appear here.
                    </EmptyDescription>
                    <Button size="sm" asChild>
                      <Link href="/feed">Back to feed</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              )}

            {!userLoading &&
              !loadingFollowers &&
              !followersError &&
              followers.length > 0 && (
                <div className={cn(pageListClass, "px-4")}>
                  {followers.map((follower) => (
                    <UserListItem
                      key={follower.id}
                      user={follower}
                      onFollowChange={(userId, isFollowing) => {
                        setFollowers((current) =>
                          current.map((item) =>
                            item.id === userId
                              ? { ...item, isFollowing }
                              : item,
                          ),
                        );
                      }}
                    />
                  ))}
                </div>
              )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function FollowingPage() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Network" backHref="/profile" />
      <Suspense
        fallback={
          <div className={cn(pageColumnClass, "px-4")}>
            <UserListSkeleton count={5} />
          </div>
        }
      >
        <FollowingPageContent />
      </Suspense>
    </AppShell>
  );
}
