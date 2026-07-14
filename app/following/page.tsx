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
import { fetchFollowing } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export default function FollowingPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowing = useCallback(async () => {
    if (!user) {
      setFollowing([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const data = await fetchFollowing(supabase, user.id);
      setFollowing(data);
    } catch (err) {
      setFollowing([]);
      setError(getErrorMessage(err, "Could not load people you follow."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFollowing();
  }, [loadFollowing]);

  const showLoading = userLoading || loading;

  return (
    <AppShell noPadding>
      <PageHeader title="Following" backHref="/profile" />
      <div className="px-4">
        {showLoading && <UserListSkeleton count={5} />}

        {!showLoading && !user && (
          <Empty className="border-0 py-16">
            <EmptyContent>
              <EmptyTitle>Sign in to see who you follow</EmptyTitle>
              <EmptyDescription>
                Your following list will appear here after you sign in.
              </EmptyDescription>
              <Button size="sm" asChild>
                <Link href="/login?next=/following">Sign in</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!showLoading && user && error && (
          <div className="space-y-3 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
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

        {!showLoading && user && !error && following.length === 0 && (
          <Empty className="border-0 py-16">
            <EmptyContent>
              <EmptyTitle>Not following anyone yet</EmptyTitle>
              <EmptyDescription>
                Use Follow in “Add to your feed” or on a profile to add people
                here.
              </EmptyDescription>
              <Button size="sm" asChild>
                <Link href="/feed">Browse feed</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!showLoading && user && !error && following.length > 0 && (
          <div className="divide-y">
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
      </div>
    </AppShell>
  );
}
