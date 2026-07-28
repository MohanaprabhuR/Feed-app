"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useMessaging } from "@/components/messaging-provider";
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
import { ProfileSkeleton } from "@/components/skeletons";
import { appToast } from "@/lib/app-toast";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import { isFollowingUser } from "@/lib/follows";
import { fetchProfileById } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export type ProfileMode = "view" | "edit" | "general";

type ProfileViewProps = {
  userId: string;
  initialMode?: ProfileMode;
  onUserLoaded?: (user: User | null) => void;
};

export function ProfileView({
  userId,
  initialMode = "view",
  onUserLoaded,
}: ProfileViewProps) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { openMessagingWithPeer } = useMessaging();
  const [mode, setMode] = useState<ProfileMode>(initialMode);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [followPending, setFollowPending] = useState(false);

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

      try {
        const supabase = createClient();
        const profile = await fetchProfileById(supabase, userId);
        let nextUser = profile;
        if (profile && currentUser?.id) {
          const following = await isFollowingUser(
            supabase,
            currentUser.id,
            profile.id,
          );
          nextUser = { ...profile, isFollowing: following };
        }
        if (!cancelled) {
          setUser(nextUser);
          onUserLoaded?.(nextUser);
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
    // Sync internal mode to the prop when the target user changes. Uses setMode
    // (not setProfileMode) so re-syncing to a prop doesn't re-notify the parent.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync mode when target user changes
    setMode(initialMode);
  }, [userId, initialMode]);

  if (userLoading) {
    return <ProfileSkeleton />;
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
  const profileUser = user;

  async function handleToggleFollow() {
    if (!currentUser) {
      router.push(`/login?next=/user/${profileUser.id}`);
      return;
    }
    if (followPending || isMe) return;

    const previousFollowing = Boolean(profileUser.isFollowing);
    const previousFollowers = profileUser.followers;

    setUser({
      ...profileUser,
      isFollowing: !previousFollowing,
      followers: Math.max(0, previousFollowers + (previousFollowing ? -1 : 1)),
    });
    setFollowPending(true);

    try {
      const next = previousFollowing
        ? (await api.users.unfollow(profileUser.id)).following
        : (await api.users.follow(profileUser.id)).following;
      setUser((current) =>
        current
          ? {
              ...current,
              isFollowing: next,
              followers: Math.max(0, previousFollowers + (next ? 1 : -1)),
            }
          : current,
      );
    } catch (err) {
      setUser((current) =>
        current
          ? {
              ...current,
              isFollowing: previousFollowing,
              followers: previousFollowers,
            }
          : current,
      );
      appToast.error(
        "Could not update follow",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setFollowPending(false);
    }
  }

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
    <div className="space-y-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
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
          <Button
            type="button"
            variant={user.isFollowing ? "outline" : "primary"}
            size="sm"
            disabled={followPending}
            aria-pressed={Boolean(user.isFollowing)}
            onClick={() => void handleToggleFollow()}
          >
            {user.isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </Item>

      <p className="text-base leading-relaxed">{user.bio || "No bio yet."}</p>

      <div className="flex gap-6 text-base">
        <Button variant="ghost" size="sm" className="h-auto px-0" asChild>
          <Link href="/following?tab=followers">
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
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          type="button"
          onClick={() => openMessagingWithPeer(user.id)}
        >
          Message
        </Button>
      )}
    </div>
  );
}
