"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import { UserListItem } from "@/components/user-list-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import { usePageLoad } from "@/hooks/use-page-load";
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
  const {
    data: suggestedUsers,
    setData: setSuggestedUsers,
    loading: loadingUsers,
  } = usePageLoad(
    async () => {
      const supabase = createClient();
      return fetchSuggestedProfiles(supabase, {
        excludeUserId: userId,
        limit: 3,
      });
    },
    [userId],
    {
      initialData: initialSuggestedUsers,
      fallbackError: "Could not load suggestions.",
      minDelayMs: 0,
      initialLoading: initialSuggestedUsers.length === 0,
    },
  );

  return (
    <aside className="space-y-4">
      <Card padding="none" className={feedCardClass}>
        <CardHeader className={feedCardTitleClass}>
          <CardTitle className="text-lg">Add to your feed</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingUsers ? (
            <Loader variant="people" count={3} />
          ) : suggestedUsers.length > 0 ? (
            <div className="divide-y">
              {suggestedUsers.map((suggestedUser) => (
                <UserListItem
                  key={suggestedUser.id}
                  user={suggestedUser}
                  onFollowChange={(followedId, isFollowing) => {
                    if (isFollowing) {
                      setSuggestedUsers((current) =>
                        current.filter((item) => item.id !== followedId),
                      );
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No other members yet. Invite friends to join the feed.
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
