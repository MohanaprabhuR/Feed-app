import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
  feedCardSectionClass,
  feedCardStatsClass,
  feedCardTitleClass,
  networkPageClass,
  pageColumnClass,
  pageListClass,
  pagePanelClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export type LoaderVariant =
  | "feed"
  | "posts"
  | "people"
  | "profile"
  | "profile-edit"
  | "network"
  | "search"
  | "notifications"
  | "settings"
  | "settings-list"
  | "comments"
  | "comment-composer"
  | "article"
  | "form"
  | "text"
  | "media"
  | "sidebar-profile"
  | "sidebar-stats"
  | "composer"
  | "conversation"
  | "thread"
  | "block";

type LoaderProps = {
  variant?: LoaderVariant;
  count?: number;
  /** Wrap in the app chrome (route `loading.tsx` files). */
  shell?: boolean;
  withComposer?: boolean;
  className?: string;
};

function times(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

function PersonRow({
  trailing = "button",
  className,
}: {
  trailing?: "button" | "dot" | "time" | "none";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4", className)}>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      {trailing === "button" ? (
        <Skeleton className="h-8 w-19 shrink-0 rounded-md" />
      ) : null}
      {trailing === "dot" ? (
        <Skeleton className="size-2 shrink-0 rounded-full bg-primary/30" />
      ) : null}
      {trailing === "time" ? <Skeleton className="h-3 w-10 shrink-0" /> : null}
    </div>
  );
}

function PostCardBlock({
  article = false,
  className,
}: {
  article?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(feedCardClass, "rounded-xl border", className)}>
      <div className={feedCardHeaderClass}>
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40 max-w-full" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
      <div className={cn(feedCardContentClass, "space-y-3")}>
        {article ? (
          <>
            <Skeleton className="aspect-2/1 w-full rounded-xl" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-4/5 max-w-md" />
          </>
        ) : (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[94%]" />
            <Skeleton className="h-4 w-[78%]" />
            <Skeleton className="aspect-video w-full rounded-xl" />
          </>
        )}
      </div>
      <div className={feedCardFooterClass}>
        <div className={feedCardStatsClass}>
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="flex w-full items-center gap-1 px-2 py-1 sm:px-3">
          <Skeleton className="h-8 w-18 rounded-md" />
          <Skeleton className="h-8 w-10 rounded-md" />
          <Skeleton className="h-8 w-10 rounded-md" />
          <Skeleton className="ml-auto size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function ComposerBlock({ className }: { className?: string }) {
  return (
    <div className={cn(feedCardClass, "rounded-xl border", className)}>
      <div className={cn(feedCardSectionClass, "space-y-3")}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
        <div className="flex items-center justify-around gap-1 border-t pt-3">
          <Skeleton className="h-8 w-22 rounded-md" />
          <Skeleton className="h-8 w-22 rounded-md" />
          <Skeleton className="h-8 w-22 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function PostsList({
  count,
  withComposer,
  className,
}: {
  count: number;
  withComposer?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("min-w-0 space-y-3 skeleton-stagger", className)}
      role="status"
      aria-label="Loading"
    >
      {withComposer ? <ComposerBlock /> : null}
      {times(count).map((index) => (
        <PostCardBlock key={index} article={index === 1} />
      ))}
    </div>
  );
}

function LoaderBody({
  variant,
  count,
  withComposer,
  className,
}: Omit<LoaderProps, "shell">) {
  if (variant === "composer") {
    return <ComposerBlock className={className} />;
  }

  if (variant === "posts") {
    return (
      <PostsList
        count={count ?? 3}
        withComposer={withComposer}
        className={className}
      />
    );
  }

  if (variant === "people") {
    return (
      <div
        className={cn("divide-y skeleton-stagger", className)}
        role="status"
        aria-label="Loading people"
      >
        {times(count ?? 4).map((index) => (
          <PersonRow key={index} />
        ))}
      </div>
    );
  }

  if (variant === "notifications") {
    return (
      <div
        className={cn("divide-y skeleton-stagger", className)}
        role="status"
        aria-label="Loading notifications"
      >
        {times(count ?? 6).map((index) => (
          <PersonRow key={index} trailing="dot" />
        ))}
      </div>
    );
  }

  if (variant === "settings-list") {
    return (
      <div className={cn("divide-y skeleton-stagger", className)}>
        {times(count ?? 5).map((index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
            <Skeleton className="size-5 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "conversation") {
    return (
      <div className={cn("skeleton-stagger", className)}>
        {times(count ?? 5).map((index) => (
          <PersonRow key={index} trailing="time" className="px-3 py-2.5" />
        ))}
      </div>
    );
  }

  if (variant === "thread") {
    return (
      <div className={cn("flex flex-col gap-2.5 py-2 skeleton-stagger", className)}>
        <Skeleton className="h-12 w-[62%] rounded-2xl rounded-bl-md" />
        <Skeleton className="ml-auto h-10 w-[48%] rounded-2xl rounded-br-md" />
        <Skeleton className="h-16 w-[70%] rounded-2xl rounded-bl-md" />
        <Skeleton className="ml-auto h-10 w-[40%] rounded-2xl rounded-br-md" />
      </div>
    );
  }

  if (variant === "comment-composer") {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
    );
  }

  if (variant === "comments") {
    return (
      <div className={cn("space-y-1 skeleton-stagger", className)}>
        {times(count ?? 3).map((index) => (
          <div key={index} className="flex gap-2 py-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-[85%]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "sidebar-profile") {
    return (
      <div className={cn("flex flex-col items-center text-center", className)}>
        <Skeleton className="size-18 rounded-full ring-4 ring-card" />
        <Skeleton className="mt-3 h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-full max-w-50" />
      </div>
    );
  }

  if (variant === "sidebar-stats") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (variant === "article") {
    return <PostCardBlock article className={className} />;
  }

  if (variant === "profile") {
    return (
      <div className={cn("space-y-5 skeleton-stagger", className)}>
        <div className={cn(feedCardClass, "rounded-xl border")}>
          <Skeleton className="h-28 w-full rounded-none sm:h-32" />
          <div className={cn(feedCardSectionClass, "space-y-4")}>
            <div className="flex items-start gap-4">
              <Skeleton className="-mt-14 size-24 shrink-0 rounded-full ring-4 ring-card sm:size-28" />
              <div className="min-w-0 flex-1 space-y-3 pt-2">
                <Skeleton className="h-7 w-48 max-w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <PostCardBlock />
      </div>
    );
  }

  if (variant === "profile-edit") {
    return (
      <div className={cn("grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]", className)}>
        <div className="space-y-5">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="size-32 rounded-full" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className={cn(feedCardClass, "rounded-xl border")}>
          <div className={cn(feedCardSectionClass, "space-y-5")}>
            {times(6).map((index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-48" />
        <div className={cn(feedCardClass, "rounded-xl border")}>
          <div className={cn(feedCardSectionClass, "space-y-4")}>
            {times(count ?? 4).map((index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={cn(feedCardClass, "rounded-xl border", className)}>
        <div className={cn(feedCardSectionClass, "space-y-3")}>
          <Skeleton className="h-6 w-40" />
          {times(count ?? 6).map((index) => (
            <Skeleton
              key={index}
              className={cn("h-4 w-full", index % 3 === 2 && "w-2/3")}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "media") {
    return (
      <div className={cn("grid grid-cols-3 gap-1 p-1", className)}>
        {times(count ?? 9).map((index) => (
          <Skeleton key={index} className="aspect-square rounded-none" />
        ))}
      </div>
    );
  }

  if (variant === "block") {
    return (
      <Skeleton className={cn("mx-auto h-48 max-w-md rounded-xl", className)} />
    );
  }

  if (variant === "network") {
    return (
      <div className={cn(networkPageClass, className)}>
        <header className="mb-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-18 rounded-xl" />
            <Skeleton className="h-18 rounded-xl" />
          </div>
        </header>
        <Skeleton className="mb-4 h-10 w-full rounded-lg" />
        <div className={pagePanelClass}>
          <LoaderBody variant="people" count={count ?? 5} />
        </div>
      </div>
    );
  }

  if (variant === "search") {
    return (
      <div className={cn(pageColumnClass, pageStackClass, className)}>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className={pageListClass}>
          <LoaderBody variant="people" count={count ?? 4} />
        </div>
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div className={cn(pageColumnClass, "space-y-6", className)}>
        {times(2).map((group) => (
          <div key={group} className="space-y-2">
            <Skeleton className="mx-1 h-3.5 w-28" />
            <div className={pagePanelClass}>
              <LoaderBody variant="settings-list" count={count ?? 3} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <div className={cn("grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-6", className)}>
        <div className="hidden lg:block">
          <div className="sticky top-18 space-y-4">
            <div className={cn(feedCardClass, "rounded-xl border")}>
              <Skeleton className="h-16 w-full rounded-none" />
              <div className={feedCardSectionClass}>
                <div className="-mt-9">
                <LoaderBody variant="sidebar-profile" />
                </div>
                <div className="my-4 h-px bg-border" />
                <LoaderBody variant="sidebar-stats" />
              </div>
            </div>
          </div>
        </div>
        <PostsList count={count ?? 3} withComposer />
        <div className="hidden lg:block">
          <div className="sticky top-18">
            <div className={cn(feedCardClass, "rounded-xl border")}>
              <div className={feedCardTitleClass}>
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="divide-y px-0 pb-2">
                <LoaderBody variant="people" count={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <PostsList count={count ?? 3} className={className} />;
}

const COLUMN_VARIANTS = new Set<LoaderVariant>([
  "posts",
  "profile",
  "article",
  "form",
  "text",
  "people",
  "notifications",
  "settings-list",
]);

const PANEL_VARIANTS = new Set<LoaderVariant>([
  "people",
  "notifications",
  "settings-list",
]);

/**
 * Single loading UI for route `loading.tsx` files and in-page states.
 * Built from `ui/skeleton` — pick a `variant` instead of a one-off component.
 */
export function Loader({
  variant = "posts",
  count,
  shell = false,
  withComposer = false,
  className,
}: LoaderProps) {
  const body = (
    <LoaderBody
      variant={variant}
      count={count}
      withComposer={withComposer}
      className={
        shell && COLUMN_VARIANTS.has(variant)
          ? cn(
              pageColumnClass,
              (variant === "posts" || variant === "form") && pageStackClass,
              PANEL_VARIANTS.has(variant) && pagePanelClass,
              className,
            )
          : className
      }
    />
  );

  if (!shell) return body;

  if (variant === "comments") {
    return (
      <AppShell noPadding feedLayout className="flex flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          <div className="flex-1 space-y-4 px-4 py-5">
            <LoaderBody variant="comments" count={count ?? 4} />
          </div>
          <div className="sticky bottom-16 border-t bg-background p-4 md:bottom-0">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (variant === "profile-edit") {
    return (
      <AppShell
        wide
        shellClassName="bg-gradient-to-b from-[#faf8f5] to-[#f3f3f3] dark:from-background dark:to-background"
        className="max-w-5xl px-4 py-8 sm:px-8 sm:py-10"
      >
        <LoaderBody variant="profile-edit" />
      </AppShell>
    );
  }

  if (variant === "feed") {
    return (
      <AppShell feedLayout>
        <LoaderBody variant="feed" count={count} />
      </AppShell>
    );
  }

  if (variant === "media") {
    return (
      <AppShell noPadding feedLayout>
        <LoaderBody variant="media" count={count} />
      </AppShell>
    );
  }

  return (
    <AppShell noPadding feedLayout>
      {body}
    </AppShell>
  );
}

