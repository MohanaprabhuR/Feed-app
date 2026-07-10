"use client";

import Link from "next/link";
import {
  Bookmark,
  Calendar,
  ChevronRight,
  Users,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { ProfileTrigger } from "@/components/profile-trigger";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const quickLinks = [
  { href: "/saved", label: "Saved items", icon: Bookmark },
  { href: "/followers", label: "Groups", icon: Users },
  { href: "/trending", label: "Newsletters", icon: Calendar },
  { href: "/search", label: "Events", icon: Calendar },
];

export function FeedLeftSidebar() {
  const { user, loading } = useCurrentUser();

  return (
    <aside className="space-y-2">
      <Card className="overflow-hidden border shadow-sm">
        <div className="h-14 bg-gradient-to-r from-sky-700 to-sky-500" />
        <CardContent className="px-4 pb-4">
          <div className="-mt-8 flex flex-col items-center text-center">
            {loading || !user ? (
              <>
                <Skeleton className="size-16 rounded-full" />
                <Skeleton className="mt-2 h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-full" />
              </>
            ) : (
              <>
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  size="md"
                  userId={user.id}
                  className="ring-4 ring-card"
                />
                <ProfileTrigger
                  userId={user.id}
                  className="mt-2 font-semibold hover:underline"
                >
                  {user.name}
                </ProfileTrigger>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {user.bio || `@${user.username}`}
                </p>
              </>
            )}
          </div>

          <Separator className="my-3" />

          <ItemGroup className="text-xs">
            <Item size="sm" className="justify-between p-0">
              <ItemDescription>Profile viewers</ItemDescription>
              <ItemTitle>128</ItemTitle>
            </Item>
            <Item size="sm" className="justify-between p-0">
              <ItemDescription>Post impressions</ItemDescription>
              <ItemTitle>1,240</ItemTitle>
            </Item>
            <Button variant="ghost" size="sm" className="h-auto px-0 text-xs" asChild>
              <Link href="/followers">View all analytics</Link>
            </Button>
          </ItemGroup>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <ItemGroup>
            {quickLinks.map(({ href, label, icon: Icon }, index) => (
              <div key={href + label}>
                <Item asChild size="sm">
                  <Link href={href}>
                    <ItemMedia variant="icon">
                      <Icon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{label}</ItemTitle>
                    </ItemContent>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </Item>
                {index < quickLinks.length - 1 && <Separator />}
              </div>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    </aside>
  );
}
