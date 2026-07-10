"use client";

import Link from "next/link";
import { useCurrentUser } from "@/components/current-user-provider";
import { getProfilePath } from "@/lib/profile-routes";
import { cn } from "@/lib/utils";

type ProfileTriggerProps = {
  userId: string;
  children: React.ReactNode;
  className?: string;
};

export function ProfileTrigger({
  userId,
  children,
  className,
}: ProfileTriggerProps) {
  const { user } = useCurrentUser();
  const href = getProfilePath(userId, user?.id);

  return (
    <Link href={href} className={cn("text-left", className)}>
      {children}
    </Link>
  );
}
