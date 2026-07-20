"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
import { getErrorMessage } from "@/lib/errors";
import {
  pageColumnClass,
  pageErrorClass,
  pageListClass,
} from "@/lib/feed-layout";
import { fetchFollowers } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FollowersPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowers = useCallback(async () => {
    if (!user) {
      setFollowers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const data = await fetchFollowers(supabase, user.id, {
        viewerId: user.id,
      });
      setFollowers(data);
    } catch (err) {
      setFollowers([]);
      setError(getErrorMessage(err, "Could not load followers."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFollowers();
  }, [loadFollowers]);

  const showLoading = userLoading || loading;

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Followers" backHref="/profile" />
      <div className={pageColumnClass}>
        {showLoading && (
          <div className={cn(pageListClass, "px-4")}>
            <UserListSkeleton count={5} />
          </div>
        )}

        {!showLoading && !user && (
          <Empty className="border bg-card py-16">
            <EmptyContent>
              <EmptyTitle>Sign in to see followers</EmptyTitle>
              <EmptyDescription>
                People who follow you will show up here.
              </EmptyDescription>
              <Button size="sm" asChild>
                <Link href="/login?next=/followers">Sign in</Link>
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
              onClick={() => void loadFollowers()}
            >
              Try again
            </Button>
          </div>
        )}

        {!showLoading && user && !error && followers.length === 0 && (
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

        {!showLoading && user && !error && followers.length > 0 && (
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
      </div>
    </AppShell>
  );
}
