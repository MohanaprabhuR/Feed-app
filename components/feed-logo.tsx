import { cn } from "@/lib/utils";

type FeedLogoMarkProps = {
  className?: string;
};

export function FeedLogoMark({ className }: FeedLogoMarkProps) {
  return (
    <span
      className={cn(
        "relative flex size-10 items-center justify-center overflow-hidden rounded-[0.7rem] sm:size-11",
        "border border-white/25 bg-foreground/75 font-sans text-lg font-bold tracking-tight text-background",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_14px_rgba(0,0,0,0.14)]",
        "backdrop-blur-md supports-[backdrop-filter]:bg-foreground/55",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-white/30 before:via-white/5 before:to-transparent",
        "dark:border-white/15 dark:bg-foreground/45 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_16px_rgba(0,0,0,0.35)]",
        "sm:text-xl",
        className,
      )}
      aria-hidden="true"
    >
      <span className="relative z-[1]">F</span>
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
      <span className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
        Feed
      </span>
    </div>
  );
}
