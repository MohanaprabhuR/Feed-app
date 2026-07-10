"use client";

import Link from "next/link";
import { useCurrentUser } from "@/components/current-user-provider";
import { UserListItem } from "@/components/user-list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { trendingTopics, users } from "@/lib/mock-data";

export function FeedRightSidebar() {
  const { user } = useCurrentUser();
  const suggestedUsers = users
    .filter((u) => u.id !== user?.id)
    .slice(0, 3);
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <aside className="space-y-2">
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">FeedApp News</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ItemGroup>
            {trendingTopics.slice(0, 4).map((topic) => (
              <Item key={topic.id} asChild size="sm" className="p-0">
                <Link href={`/search?q=${topic.tag}`}>
                  <ItemContent>
                    <ItemTitle>#{topic.tag}</ItemTitle>
                    <ItemDescription>
                      {topic.posts.toLocaleString()} readers · Trending
                    </ItemDescription>
                  </ItemContent>
                </Link>
              </Item>
            ))}
          </ItemGroup>
          <Button variant="ghost" className="mt-3 w-full" size="sm" asChild>
            <Link href="/trending">Show more</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add to your feed</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="divide-y">
            {suggestedUsers.map((suggestedUser) => (
              <UserListItem key={suggestedUser.id} user={suggestedUser} />
            ))}
          </div>
          <Button variant="ghost" className="mt-2 w-full" size="sm" asChild>
            <Link href="/search">View all recommendations</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">
            {firstName}, boost your network
          </p>
          <p className="text-xs text-muted-foreground">
            See who else you may know from your industry.
          </p>
          <Button className="w-full rounded-full" size="sm" asChild>
            <Link href="/search">Try for free</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="px-2 text-center text-[11px] text-muted-foreground">
        About · Accessibility · Help Center · Privacy · Terms
      </p>
    </aside>
  );
}
