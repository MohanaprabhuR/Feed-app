"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight, Users } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { ProfileTrigger } from "@/components/profile-trigger";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Loader } from "@/components/loader";
import { fetchSavedPostCount, SAVED_POSTS_CHANGED_EVENT } from "@/lib/saves";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const quickLinks = [
  { href: "/saved", label: "Saved items", icon: Bookmark },
  { href: "/following?tab=followers", label: "Followers", icon: Users },
];

function formatCount(value: number) {
  return value.toLocaleString();
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FeedLeftSidebar() {
  const { user, loading } = useCurrentUser();
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const supabase = createClient();
    void fetchSavedPostCount(supabase, user.id)
      .then((count) => {
        if (!cancelled) setSavedCount(count);
      })
      .catch(() => {
        if (!cancelled) setSavedCount(0);
      });

    function onSavedChange(event: Event) {
      const delta =
        (event as CustomEvent<{ delta?: number }>).detail?.delta ?? 0;
      setSavedCount((current) => Math.max(0, (current ?? 0) + delta));
    }

    window.addEventListener(SAVED_POSTS_CHANGED_EVENT, onSavedChange);

    return () => {
      cancelled = true;
      window.removeEventListener(SAVED_POSTS_CHANGED_EVENT, onSavedChange);
    };
  }, [user?.id]);

  return (
    <aside className="space-y-4">
      <Card size="md" padding="none" className="overflow-hidden shadow-sm">
        <div className="h-16 bg-linear-to-r from-sky-700 to-sky-500" />
        <CardHeader className="-mt-6 justify-items-center px-4 pb-0 pt-0 text-center sm:px-5">
          {loading || !user ? (
            <Loader variant="sidebar-profile" />
          ) : (
            <>
              <ProfileTrigger
                userId={user.id}
                className="inline-flex overflow-visible rounded-full"
              >
                <Avatar size="3xl" className="ring-2 ring-card">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
              </ProfileTrigger>
              <CardTitle className="mt-2 truncate text-base font-semibold tracking-normal">
                <ProfileTrigger userId={user.id} className="hover:underline">
                  {user.name}
                </ProfileTrigger>
              </CardTitle>
              <CardDescription className="line-clamp-2 text-sm">
                {user.bio || `@${user.username}`}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-4 sm:px-5">
          <Separator className="mb-4" />
          {loading || !user ? (
            <Loader variant="sidebar-stats" />
          ) : (
            <ItemGroup className="gap-1 text-sm">
              <Item size="sm" className="justify-between p-0">
                <ItemDescription>Profile viewers</ItemDescription>
                <ItemTitle>128</ItemTitle>
              </Item>
              <Item size="sm" className="justify-between p-0">
                <ItemDescription>Post impressions</ItemDescription>
                <ItemTitle>1,240</ItemTitle>
              </Item>

              <Link
                href="/following?tab=followers"
                className="mt-3 text-sm text-foreground hover:text-primary hover:underline"
              >
                View all analytics
              </Link>
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <Card size="md" padding="none" className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <ItemGroup>
            {quickLinks.map(({ href, label, icon: Icon }, index) => {
              const count =
                label === "Saved items"
                  ? user
                    ? (savedCount ?? 0)
                    : null
                  : user
                    ? user.followers
                    : null;

              return (
                <div key={href + label}>
                  <Item asChild size="sm">
                    <Link href={href}>
                      <ItemMedia variant="icon">
                        <Icon />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{label}</ItemTitle>
                      </ItemContent>
                      {typeof count === "number" ? (
                        <Badge size="sm" theme="blue">
                          {formatCount(count)}
                        </Badge>
                      ) : null}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </Item>
                  {index < quickLinks.length - 1 && <Separator />}
                </div>
              );
            })}
          </ItemGroup>
        </CardContent>
      </Card>
    </aside>
  );
}
