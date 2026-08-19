"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/components/current-user-provider";
import { UserListItem } from "@/components/user-list-item";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageLoad } from "@/hooks/use-page-load";
import {
  networkPageClass,
  pageErrorClass,
  pageListRowsClass,
  pagePanelClass,
} from "@/lib/feed-layout";
import { fetchFollowers, fetchFollowing } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type NetworkTab = "following" | "followers";

const EMPTY_USERS: User[] = [];

function parseTab(value: string | null): NetworkTab {
  return value === "followers" ? "followers" : "following";
}

function NetworkListPanel({
  users,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onFollowChange,
}: {
  users: User[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}) {
  if (loading) {
    return (
      <Card padding="none" className={cn(pagePanelClass, "min-h-[min(60vh,520px)]")}>
        <CardContent className="p-0">
          <Loader variant="people" count={5} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="none" className={pagePanelClass}>
        <CardContent className={cn(pageErrorClass, "p-6")}>
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card padding="none" className={cn(pagePanelClass, "min-h-[min(60vh,520px)]")}>
        <CardContent className="p-0">
          <Empty className="min-h-[min(50vh,420px)] border-0 bg-transparent py-16">
            <EmptyContent>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
              {emptyAction}
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card padding="none" className={cn(pagePanelClass, "min-h-[min(60vh,520px)]")}>
      <CardContent className="p-0">
        <div className={pageListRowsClass}>
          {users.map((profile) => (
            <UserListItem
              key={profile.id}
              user={profile}
              onFollowChange={onFollowChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FollowingPageContent() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const signedIn = Boolean(user);

  const {
    data: following,
    setData: setFollowing,
    loading: loadingFollowing,
    error: followingError,
    reload: loadFollowing,
  } = usePageLoad(
    async () => {
      const supabase = createClient();
      return fetchFollowing(supabase, user!.id);
    },
    [user?.id],
    {
      enabled: signedIn,
      initialData: EMPTY_USERS,
      fallbackError: "Could not load people you follow.",
    },
  );

  const {
    data: followers,
    setData: setFollowers,
    loading: loadingFollowers,
    error: followersError,
    reload: loadFollowers,
  } = usePageLoad(
    async () => {
      const supabase = createClient();
      return fetchFollowers(supabase, user!.id, { viewerId: user!.id });
    },
    [user?.id],
    {
      enabled: signedIn,
      initialData: EMPTY_USERS,
      fallbackError: "Could not load followers.",
    },
  );

  function handleTabChange(value: string) {
    const tab = parseTab(value);
    router.replace(
      tab === "following" ? "/following" : "/following?tab=followers",
    );
  }

  const showAuthGate = !userLoading && !user;
  const showStats =
    !showAuthGate &&
    !userLoading &&
    !loadingFollowing &&
    !loadingFollowers &&
    !followingError &&
    !followersError;

  return (
    <div className={networkPageClass}>
      <header className="mb-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Network</h1>
          <p className="text-sm text-muted-foreground">
            People you follow and who follow you.
          </p>
        </div>

        {showStats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold tabular-nums">
                {following.length}
              </p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
            <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold tabular-nums">
                {followers.length}
              </p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
          </div>
        ) : null}
      </header>

      {showAuthGate ? (
        <Card padding="none" className={pagePanelClass}>
          <CardContent className="p-0">
            <Empty className="min-h-[min(50vh,420px)] border-0 bg-transparent py-16">
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
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} variant="subtle" size="md">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="following">
              Following
              {!loadingFollowing && !followingError ? (
                <span className="ml-1.5 tabular-nums text-muted-foreground">
                  ({following.length})
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="followers">
              Followers
              {!loadingFollowers && !followersError ? (
                <span className="ml-1.5 tabular-nums text-muted-foreground">
                  ({followers.length})
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {activeTab === "following" ? (
            <NetworkListPanel
              users={following}
              loading={userLoading || loadingFollowing}
              error={followingError}
              onRetry={() => void loadFollowing()}
              emptyTitle="Not following anyone yet"
              emptyDescription='Use Follow in "Add to your feed" or on a profile to add people here.'
              emptyAction={
                <Button size="sm" asChild>
                  <Link href="/feed">Browse feed</Link>
                </Button>
              }
              onFollowChange={(userId, isFollowing) => {
                if (!isFollowing) {
                  setFollowing((current) =>
                    current.filter((item) => item.id !== userId),
                  );
                }
              }}
            />
          ) : (
            <NetworkListPanel
              users={followers}
              loading={userLoading || loadingFollowers}
              error={followersError}
              onRetry={() => void loadFollowers()}
              emptyTitle="No followers yet"
              emptyDescription="When someone follows you, they'll appear here."
              emptyAction={
                <Button size="sm" asChild>
                  <Link href="/feed">Back to feed</Link>
                </Button>
              }
              onFollowChange={(userId, isFollowing) => {
                setFollowers((current) =>
                  current.map((item) =>
                    item.id === userId ? { ...item, isFollowing } : item,
                  ),
                );
              }}
            />
          )}
        </Tabs>
      )}
    </div>
  );
}

export default function FollowingPage() {
  return (
    <AppShell noPadding feedLayout>
      <Suspense fallback={null}>
        <FollowingPageContent />
      </Suspense>
    </AppShell>
  );
}
