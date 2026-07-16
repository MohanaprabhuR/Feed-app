"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { MessageCircle, Repeat2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReactionMeta } from "@/lib/likes";
import type { ReactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostEngagementBarProps = {
  postId: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  types?: ReactionType[];
  likeControl: ReactNode;
  trailing?: ReactNode;
  commentsOpen?: boolean;
  onOpenComments?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  className?: string;
};

function ReactionBadge({
  type,
  overlap,
}: {
  type: ReactionType;
  overlap?: boolean;
}) {
  const meta = getReactionMeta(type);
  return (
    <span
      className={cn(
        "relative flex size-[18px] items-center justify-center rounded-full text-[11px] leading-none ring-2 ring-background",
        meta.bg,
        overlap && "-ml-1.5",
      )}
      aria-hidden
    >
      {meta.emoji}
    </span>
  );
}

/**
 * Single-row LinkedIn-style engagement + actions:
 * like · reaction count · comment(+count) · repost(+count) · send · … · stacked types · trailing
 */
export function PostEngagementBar({
  postId,
  likesCount,
  commentsCount,
  sharesCount,
  types = [],
  likeControl,
  trailing,
  commentsOpen,
  onOpenComments,
  onRepost,
  onShare,
  className,
}: PostEngagementBarProps) {
  const hasLikes = likesCount > 0;
  // Never show more type badges than total reactions (fixes 2 icons with count 1).
  const maxTypes = Math.min(3, Math.max(likesCount, 0));
  const shown = (
    types.length > 0
      ? types
      : hasLikes
        ? (["like"] as ReactionType[])
        : []
  ).slice(0, maxTypes);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 px-2 py-1 sm:px-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <div className="flex items-center gap-0.5">
          {likeControl}
          {hasLikes ? (
            <Link
              href={`/post/${postId}/likes`}
              className="inline-flex items-center gap-1 pr-1 text-sm font-semibold text-foreground/80 hover:text-foreground hover:underline"
              aria-label={`${likesCount} reactions`}
            >
              <span className="tabular-nums tracking-tight">{likesCount}</span>
            </Link>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-1.5 justify-start px-2",
            commentsOpen && "bg-accent",
          )}
          aria-expanded={commentsOpen}
          aria-label="Toggle comments"
          onClick={onOpenComments}
        >
          <MessageCircle className="size-4" />
          {commentsCount > 0 ? (
            <span className="tabular-nums text-sm font-semibold text-foreground/80">
              {commentsCount}
            </span>
          ) : null}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 justify-start px-2"
          aria-label="Repost"
          onClick={onRepost}
        >
          <Repeat2 className="size-4" />
          {sharesCount > 0 ? (
            <span className="tabular-nums text-sm font-semibold text-foreground/80">
              {sharesCount}
            </span>
          ) : null}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          className="h-9 justify-start"
          aria-label="Share post"
          onClick={onShare}
        >
          <Send className="size-4" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {hasLikes && shown.length > 0 ? (
          <Link
            href={`/post/${postId}/likes`}
            className="flex items-center pl-1"
            aria-label="View reactions"
          >
            {shown.map((type, index) => (
              <span
                key={`${type}-${index}`}
                style={{ zIndex: shown.length - index }}
                className="relative"
              >
                <ReactionBadge type={type} overlap={index > 0} />
              </span>
            ))}
          </Link>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}

/** Keep summary icons in sync when the current user adds / changes / removes a reaction. */
export function mergeReactionSummary(
  current: ReactionType[],
  previous: ReactionType | null | undefined,
  next: ReactionType | null,
  likesCount?: number,
): ReactionType[] {
  if (likesCount !== undefined && likesCount <= 0) return [];
  // One reactor can only contribute one type.
  if (likesCount === 1) return next ? [next] : [];

  let summary = [...current];

  // Drop previous on clear or change so swaps don't stack leftover badges.
  if (previous) {
    summary = summary.filter((type) => type !== previous);
  }

  if (next) {
    summary = [next, ...summary.filter((type) => type !== next)];
  }

  const max =
    likesCount !== undefined ? Math.min(3, Math.max(likesCount, 0)) : 3;
  return summary.slice(0, max);
}
