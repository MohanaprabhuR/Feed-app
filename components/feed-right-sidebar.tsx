"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { UserListItem } from "@/components/user-list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { feedCardClass, feedCardTitleClass } from "@/lib/feed-layout";
import { fetchSuggestedProfiles } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

type FeedRightSidebarProps = {
  initialSuggestedUsers?: User[];
};

export function FeedRightSidebar({
  initialSuggestedUsers = [],
}: FeedRightSidebarProps) {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>(
    initialSuggestedUsers,
  );
  const [loadingUsers, setLoadingUsers] = useState(
    initialSuggestedUsers.length === 0,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestedUsers() {
      setLoadingUsers(true);
      try {
        const supabase = createClient();
        const profiles = await fetchSuggestedProfiles(supabase, {
          excludeUserId: userId,
          limit: 3,
        });
        if (!cancelled) setSuggestedUsers(profiles);
      } catch {
        if (!cancelled) setSuggestedUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    void loadSuggestedUsers();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <aside className="space-y-4">
      <Card padding="none" className={feedCardClass}>
        <CardHeader className={feedCardTitleClass}>
          <CardTitle className="text-lg">Add to your feed</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          ) : suggestedUsers.length > 0 ? (
            <div className="divide-y">
              {suggestedUsers.map((suggestedUser) => (
                <UserListItem key={suggestedUser.id} user={suggestedUser} />
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No other members yet. Invite friends to join the feed.
            </p>
          )}
          <Button variant="ghost" className="mt-2 w-full" size="sm" asChild>
            <Link href="/search">View all recommendations</Link>
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
