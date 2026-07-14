"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { ProfileGeneralSettings } from "@/components/profile-general-settings";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserById } from "@/lib/mock-data";
import { fetchProfileById } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export type ProfileMode = "view" | "edit" | "general";

type ProfileViewProps = {
  userId: string;
  initialMode?: ProfileMode;
  onModeChange?: (mode: ProfileMode) => void;
  onUserLoaded?: (user: User | null) => void;
};

export function ProfileView({
  userId,
  initialMode = "view",
  onModeChange,
  onUserLoaded,
}: ProfileViewProps) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [mode, setMode] = useState<ProfileMode>(initialMode);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  function setProfileMode(next: ProfileMode) {
    setMode(next);
    onModeChange?.(next);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setUserLoading(true);

      if (currentUser?.id === userId) {
        if (!cancelled) {
          setUser(currentUser);
          onUserLoaded?.(currentUser);
          setUserLoading(false);
        }
        return;
      }

      const mockUser = getUserById(userId);
      if (mockUser) {
        if (!cancelled) {
          setUser(mockUser);
          onUserLoaded?.(mockUser);
          setUserLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const profile = await fetchProfileById(supabase, userId);
        if (!cancelled) {
          setUser(profile);
          onUserLoaded?.(profile);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          onUserLoaded?.(null);
        }
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [userId, currentUser, onUserLoaded]);

  useEffect(() => {
    setProfileMode(initialMode);
  }, [userId, initialMode]);

  if (userLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Empty className="border-0">
        <EmptyContent>
          <EmptyTitle>User not found</EmptyTitle>
          <EmptyDescription>
            This profile may have been removed or is unavailable.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    );
  }

  const isMe = currentUser?.id === user.id;

  if (isMe && mode === "edit") {
    return (
      <ProfileEditForm
        user={user}
        onCancel={() => router.push("/profile")}
        onSaved={() => router.push("/profile")}
      />
    );
  }

  if (isMe && mode === "general") {
    return <ProfileGeneralSettings user={user} />;
  }

  return (
    <div className="space-y-6">
      <Item size="sm" className="items-start p-0">
        <UserAvatar src={user.avatar} name={user.name} size="lg" />
        <ItemContent>
          <ItemTitle className="text-2xl font-semibold tracking-tight">
            {user.name}
          </ItemTitle>
          <ItemDescription className="text-base">
            @{user.username}
          </ItemDescription>
        </ItemContent>
        {!isMe && (
          <Button variant={user.isFollowing ? "outline" : "primary"} size="sm">
            {user.isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </Item>

      <p className="text-base leading-relaxed">{user.bio || "No bio yet."}</p>

      <div className="flex gap-6 text-base">
        <Button variant="ghost" size="sm" className="h-auto px-0" asChild>
          <Link href="/followers">
            <span className="font-semibold">{user.followers}</span>{" "}
            <span className="text-muted-foreground">Followers</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="h-auto px-0" asChild>
          <Link href="/following">
            <span className="font-semibold">{user.following}</span>{" "}
            <span className="text-muted-foreground">Following</span>
          </Link>
        </Button>
        {isMe ? (
          <Button variant="ghost" size="sm" className="h-auto px-0" asChild>
            <Link href="/my-posts">
              <span className="font-semibold">{user.posts}</span>{" "}
              <span className="text-muted-foreground">Posts</span>
            </Link>
          </Button>
        ) : (
          <span>
            <span className="font-semibold">{user.posts}</span>{" "}
            <span className="text-muted-foreground">Posts</span>
          </span>
        )}
      </div>

      {isMe ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/edit">Edit profile</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/settings">General</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/my-posts">My posts</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/saved">Saved</Link>
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" size="sm" asChild>
          <Link href="/messages">Message</Link>
        </Button>
      )}
    </div>
  );
}
