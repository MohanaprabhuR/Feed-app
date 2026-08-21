"use client";

import { useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { MeMenuPanel } from "@/components/me-menu-panel";
import { UserAvatar } from "@/components/user-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MeMenuProps = {
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
};

export function MeMenu({
  className,
  align = "end",
  side = "bottom",
}: MeMenuProps) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Button
        variant="ghost"
        disabled
        className={cn(
          "flex min-w-16 h-auto flex-col items-center gap-0.5 px-1 py-1 text-2xs text-muted-foreground",
          className
        )}
      >
        <Avatar size="md" className="size-5">
          <AvatarFallback className="bg-muted" />
        </Avatar>
        <span>Me</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex min-w-16 h-auto flex-col items-center gap-0.5 px-1 py-1 text-2xs text-muted-foreground",
            open && "text-foreground",
            className
          )}
        >
          <UserAvatar src={user.avatar} name={user.name} size="sm" />
          <span>Me</span>
          {/* Match the NavItem indicator so the active/open line looks identical
              across the whole nav (rounded pill, stable height). */}
          <span
            className={cn(
              "h-0.5 w-6 rounded-full transition-colors",
              open ? "bg-foreground" : "bg-transparent",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-auto p-0"
      >
        <MeMenuPanel user={user} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
