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

export function UserListItem({
  user,
  action,
  subtitle,
}: UserListItemProps) {
  return (
    <Item size="sm" className="p-0">
      <UserAvatar src={user.avatar} name={user.name} userId={user.id} />
      <ItemContent>
        <ItemTitle>
          <ProfileTrigger userId={user.id} className="hover:underline">
            {user.name}
          </ProfileTrigger>
        </ItemTitle>
        <ItemDescription>{subtitle ?? `@${user.username}`}</ItemDescription>
      </ItemContent>
      {action ?? (
        <Button variant={user.isFollowing ? "outline" : "primary"} size="sm">
          {user.isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </Item>
  );
}
