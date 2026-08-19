"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-provider";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileTrigger } from "@/components/profile-trigger";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { appToast } from "@/lib/app-toast";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type UserListItemProps = {
  user: User;
  action?: React.ReactNode;
  subtitle?: string;
  className?: string;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
};

export function UserListItem({
  user,
  action,
  subtitle,
  className,
  onFollowChange,
}: UserListItemProps) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [following, setFollowing] = useState(Boolean(user.isFollowing));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowing(Boolean(user.isFollowing));
  }, [user.id, user.isFollowing]);

  async function handleToggleFollow() {
    if (!currentUser) {
      router.push("/login?next=/feed");
      return;
    }

    if (currentUser.id === user.id || pending) return;

    const previous = following;
    setFollowing(!previous);
    setPending(true);

    try {
      const next = previous
        ? (await api.users.unfollow(user.id)).following
        : (await api.users.follow(user.id)).following;
      setFollowing(next);
      onFollowChange?.(user.id, next);
      if (next) {
        appToast.success("Following", `You are now following ${user.name}.`);
      } else {
        appToast.success("Unfollowed", `You unfollowed ${user.name}.`);
      }
    } catch (err) {
      setFollowing(previous);
      appToast.error(
        "Could not update follow",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Item
      size="sm"
      className={cn(
        "items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4",
        className,
      )}
    >
      <UserAvatar src={user.avatar} name={user.name} userId={user.id} size="md" />
      <ItemContent className="min-w-0 gap-0.5">
        <ItemTitle className="truncate text-base font-semibold">
          <ProfileTrigger userId={user.id} className="hover:underline">
            {user.name}
          </ProfileTrigger>
        </ItemTitle>
        <ItemDescription className="truncate text-sm">
          {subtitle ?? `@${user.username}`}
        </ItemDescription>
        {user.bio ? (
          <p className="truncate text-xs text-muted-foreground">{user.bio}</p>
        ) : null}
      </ItemContent>
      {action ?? (
        <Button
          type="button"
          variant={following ? "outline" : "primary"}
          size="sm"
          className="shrink-0"
          disabled={pending || currentUser?.id === user.id}
          aria-pressed={following}
          onClick={() => void handleToggleFollow()}
        >
          {following ? "Following" : "Follow"}
        </Button>
      )}
    </Item>
  );
}
