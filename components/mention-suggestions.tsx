"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UserAvatar } from "@/components/user-avatar";
import { Username } from "@/components/username";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type MentionSuggestionsProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  users: User[];
  loading?: boolean;
  activeIndex: number;
  onSelect: (user: User) => void;
  open: boolean;
};

export function MentionSuggestions({
  anchorRef,
  users,
  loading = false,
  activeIndex,
  onSelect,
  open,
}: MentionSuggestionsProps) {
  const [position, setPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      const el = anchorRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const preferAbove = spaceAbove >= spaceBelow;

      setPosition({
        left: rect.left,
        width: Math.max(rect.width, 260),
        ...(preferAbove
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, open, users.length, loading]);

  if (!open || !position || (!loading && users.length === 0)) return null;

  return createPortal(
    <div
      role="listbox"
      aria-label="Mention suggestions"
      style={{
        position: "fixed",
        left: position.left,
        width: position.width,
        ...(position.top !== undefined ? { top: position.top } : {}),
        ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
      }}
      className="z-200 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg"
    >
      {loading && users.length === 0 ? (
        <div className="skeleton-stagger space-y-1 p-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md px-2 py-2"
            >
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        users.map((user, index) => (
          <button
            key={user.id}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
              index === activeIndex && "bg-accent",
            )}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(user);
            }}
          >
            <UserAvatar src={user.avatar} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                <Username username={user.username} />
              </p>
            </div>
          </button>
        ))
      )}
    </div>,
    document.body,
  );
}
