"use client";

import { UserAvatar } from "@/components/user-avatar";
import { ProfileTrigger } from "@/components/profile-trigger";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { User } from "@/lib/types";

type UserListItemProps = {
  user: User;
  action?: React.ReactNode;
  subtitle?: string;
};

export function UserListItem({ user, action, subtitle }: UserListItemProps) {
  return (
    <Item size="sm" className="items-center gap-3 py-3">
      <UserAvatar src={user.avatar} name={user.name} userId={user.id} />
      <ItemContent className="min-w-0">
        <ItemTitle className="truncate">
          <ProfileTrigger userId={user.id} className="hover:underline">
            {user.name}
          </ProfileTrigger>
        </ItemTitle>
        <ItemDescription className="truncate">
          {subtitle ?? `@${user.username}`}
        </ItemDescription>
      </ItemContent>
      {action ?? (
        <Button
          variant={user.isFollowing ? "outline" : "primary"}
          size="sm"
          className="shrink-0"
        >
          {user.isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </Item>
  );
}
