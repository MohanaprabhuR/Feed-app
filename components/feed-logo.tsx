import { cn } from "@/lib/utils";

type FeedLogoMarkProps = {
  className?: string;
};

export function FeedLogoMark({ className }: FeedLogoMarkProps) {
  return (
    <span
      className={cn(
        "relative flex size-10 items-center justify-center overflow-hidden rounded-xl sm:size-11",
        "border border-white/25 bg-linear-to-br from-sky-400 via-blue-500 to-indigo-600 font-sans text-lg font-bold tracking-tight text-white",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_4px_14px_rgba(37,99,235,0.35)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:from-white/35 before:via-white/5 before:to-transparent",
        "dark:border-white/15 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_16px_rgba(37,99,235,0.45)]",
        "sm:text-xl",
        className,
      )}
      aria-hidden="true"
    >
      <span className="relative z-1">F</span>
    </span>
  );
}

type FeedMarkProps = {
  className?: string;
};

export function FeedMark({ className }: FeedMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <FeedLogoMark />
      <span className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Feed
      </span>
    </div>
  );
}
