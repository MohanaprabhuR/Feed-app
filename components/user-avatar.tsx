"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarStatus,
} from "@/components/ui/avatar";
import { useCurrentUser } from "@/components/current-user-provider";
import { ProfileTrigger } from "@/components/profile-trigger";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg";
  userId?: string;
  className?: string;
  status?: AvatarStatus;
};

const sizeMap = {
  sm: "md" as const,
  md: "2xl" as const,
  lg: "3xl" as const,
};

const sizeClassOverrides = {
  sm: "",
  md: "",
  lg: "!size-20",
};

export function UserAvatar({
  src,
  name,
  size = "md",
  userId,
  className,
  status = "null",
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatar = (
    <Avatar
      size={sizeMap[size]}
      status={status}
      className={cn(sizeClassOverrides[size], className)}
    >
      <AvatarImage src={src} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );

  if (userId) {
    return (
      <ProfileTrigger userId={userId} className="inline-flex overflow-visible rounded-full">
        {avatar}
      </ProfileTrigger>
    );
  }

  return avatar;
}

export function CurrentUserAvatar({
  size = "md",
  className,
  status = "active",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  status?: AvatarStatus;
}) {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <span
        className={cn(
          "rounded-full bg-muted",
          size === "sm" && "size-8",
          size === "md" && "size-10",
          size === "lg" && "size-20",
          className
        )}
      />
    );
  }

  return (
    <UserAvatar
      src={user.avatar}
      name={user.name}
      size={size}
      userId={user.id}
      status={status}
      className={className}
    />
  );
}
