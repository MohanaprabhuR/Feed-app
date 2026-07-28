"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import { getReactionMeta, REACTIONS } from "@/lib/likes";
import type { ReactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReactionButtonProps = {
  initialReaction?: ReactionType | null;
  initialLiked?: boolean;
  initialCount: number;
  loginNext?: string;
  countHref?: string;
  compact?: boolean;
  hideCount?: boolean;
  className?: string;
  onOptimisticChange?: (
    reaction: ReactionType | null,
    likesCount: number,
  ) => void;
  onReact: (
    reaction: ReactionType | null,
  ) => Promise<{ reaction: ReactionType | null; likesCount: number }>;
};

const OPEN_DELAY_MS = 450;
const CLOSE_DELAY_MS = 220;

export function ReactionButton({
  initialReaction = null,
  initialLiked = false,
  initialCount,
  loginNext = "/login",
  countHref,
  compact = false,
  hideCount = false,
  className,
  onOptimisticChange,
  onReact,
}: ReactionButtonProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [reaction, setReactionState] = useState<ReactionType | null>(
    initialReaction ?? (initialLiked ? "like" : null),
  );
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(
    null,
  );
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClick = useRef(false);
  const skipNextSyncRef = useRef(false);

  // Sync from parent when feed data changes. Skip while saving, and skip once
  // after save completes so stale props cannot wipe the optimistic icon state.
  useEffect(() => {
    if (pending) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    setReactionState(initialReaction ?? (initialLiked ? "like" : null));
    setCount(initialCount);
  }, [initialCount, initialLiked, initialReaction, pending]);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  function clearOpenTimer() {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openPickerNow() {
    clearOpenTimer();
    clearCloseTimer();
    setPickerOpen(true);
  }

  function scheduleOpenPicker() {
    clearCloseTimer();
    clearOpenTimer();
    openTimer.current = setTimeout(() => {
      setPickerOpen(true);
      openTimer.current = null;
    }, OPEN_DELAY_MS);
  }

  function scheduleClosePicker() {
    clearOpenTimer();
    clearCloseTimer();
    setHoveredReaction(null);
    closeTimer.current = setTimeout(() => {
      setPickerOpen(false);
      closeTimer.current = null;
    }, CLOSE_DELAY_MS);
  }

  async function applyReaction(next: ReactionType | null) {
    if (!user) {
      router.push(
        loginNext.startsWith("/login")
          ? loginNext
          : `/login?next=${encodeURIComponent(loginNext)}`,
      );
      return;
    }
    if (pending) return;

    const previousReaction = reaction;
    const previousCount = count;
    const wasReacted = previousReaction !== null;
    const willReact = next !== null;
    const optimisticCount = Math.max(
      previousCount + (wasReacted === willReact ? 0 : willReact ? 1 : -1),
      0,
    );

    setPending(true);
    setReactionState(next);
    setCount(optimisticCount);
    onOptimisticChange?.(next, optimisticCount);
    setPickerOpen(false);
    setHoveredReaction(null);
    clearOpenTimer();
    clearCloseTimer();

    try {
      const result = await onReact(next);
      setReactionState(result.reaction);
      setCount(result.likesCount);
    } catch (error) {
      setReactionState(previousReaction);
      setCount(previousCount);
      onOptimisticChange?.(previousReaction, previousCount);
      appToast.error(
        "Could not update reaction",
        getErrorMessage(error, "Please try again."),
      );
    } finally {
      skipNextSyncRef.current = true;
      setPending(false);
    }
  }

  async function handleMainClick() {
    if (ignoreClick.current) {
      ignoreClick.current = false;
      return;
    }

    // Quick click like LinkedIn: like if none, remove if already reacted
    clearOpenTimer();
    setPickerOpen(false);

    if (reaction) {
      await applyReaction(null);
      return;
    }

    await applyReaction("like");
  }

  function handlePointerDown() {
    longPressTimer.current = setTimeout(() => {
      ignoreClick.current = true;
      openPickerNow();
    }, 350);
  }

  function handlePointerUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const meta = getReactionMeta(reaction ?? "like");
  const isReacted = reaction !== null;

  return (
    <div
      className={cn("relative flex items-center", className)}
      onMouseEnter={scheduleOpenPicker}
      onMouseLeave={scheduleClosePicker}
    >
      {pickerOpen && (
        <div
          className="absolute bottom-[calc(100%+8px)] left-0 z-40 flex items-end gap-1 rounded-full border bg-background px-2 py-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
          onMouseEnter={openPickerNow}
          onMouseLeave={scheduleClosePicker}
          role="menu"
          aria-label="Choose a reaction"
        >
          {REACTIONS.map((item) => {
            const active = hoveredReaction === item.type;
            const selected = reaction === item.type;
            return (
              <div
                key={item.type}
                className="relative flex flex-col items-center"
              >
                {active && (
                  <span className="absolute -top-7 rounded-md bg-foreground px-2 py-0.5 text-2xs font-medium text-background whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                <button
                  type="button"
                  role="menuitem"
                  title={item.label}
                  disabled={pending}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-lg transition-transform duration-150 focus-visible:outline-none",
                    item.bg,
                    active && "scale-125",
                    selected && "ring-2 ring-primary ring-offset-1",
                  )}
                  onMouseEnter={() => setHoveredReaction(item.type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  onFocus={() => setHoveredReaction(item.type)}
                  onBlur={() => setHoveredReaction(null)}
                  onClick={() => void applyReaction(item.type)}
                >
                  <span aria-hidden>{item.emoji}</span>
                  <span className="sr-only">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          compact ? "h-7 px-2" : "h-9 justify-start",
          isReacted && meta.color,
        )}
        disabled={pending}
        iconOnly={!compact}
        onClick={() => void handleMainClick()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-pressed={isReacted}
        aria-label={isReacted ? `Remove ${meta.label}` : "Like"}
        aria-haspopup="menu"
        aria-expanded={pickerOpen}
      >
        {isReacted ? (
          <span
            className={cn("leading-none", compact ? "text-sm" : "text-base")}
            aria-hidden
          >
            {meta.emoji}
          </span>
        ) : (
          <ThumbsUp className={cn(compact ? "size-3.5" : "size-4")} />
        )}
      </Button>

      {hideCount ? null : countHref ? (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-1.5 text-muted-foreground hover:text-foreground",
            compact && "h-7 px-1 text-xs",
          )}
          asChild
        >
          <Link href={countHref} aria-label="View reactions">
            {count > 0 ? count : null}
          </Link>
        </Button>
      ) : count > 0 ? (
        <span
          className={cn(
            "px-1 text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}
