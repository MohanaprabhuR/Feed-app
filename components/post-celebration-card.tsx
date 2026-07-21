"use client";

import { getCelebrationMeta } from "@/lib/celebrations";
import type { PostCelebration } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PostCelebrationCard({
  celebration,
  className,
}: {
  celebration: PostCelebration;
  className?: string;
}) {
  const meta = getCelebrationMeta(celebration.occasion);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50 to-rose-50 shadow-sm dark:from-amber-950/30 dark:to-rose-950/30",
        className,
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background text-2xl shadow-sm">
          {meta.emoji}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-serif text-lg font-medium leading-tight tracking-tight">
            Celebrating {meta.label.toLowerCase()}
          </p>
          {celebration.message ? (
            <p className="text-sm text-muted-foreground">
              {celebration.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
