import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
  feedCardSectionClass,
  feedCardStatsClass,
  feedCardTitleClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

function EngagementFooterSkeleton() {
  return (
    <CardFooter className={feedCardFooterClass}>
      <div className={feedCardStatsClass}>
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            <Skeleton className="size-4.5 rounded-full ring-2 ring-card" />
            <Skeleton className="size-4.5 rounded-full ring-2 ring-card" />
          </div>
          <Skeleton className="h-3.5 w-8" />
        </div>
        <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="flex w-full items-center gap-1 px-2 py-1 sm:px-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              "h-8 rounded-md",
              index === 0 ? "w-18" : "w-10",
            )}
          />
        ))}
        <Skeleton className="ml-auto size-8 rounded-md" />
      </div>
    </CardFooter>
  );
}

function PostHeaderSkeleton() {
  return (
    <CardHeader className={feedCardHeaderClass}>
      <Skeleton className="size-10 shrink-0 rounded-full ring-2 ring-background" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40 max-w-full" />
      </div>
      <Skeleton className="size-8 shrink-0 rounded-md" />
    </CardHeader>
  );
}

export function PostCardSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <PostHeaderSkeleton />
      <CardContent className={cn(feedCardContentClass, "space-y-3")}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[94%]" />
          <Skeleton className="h-4 w-[78%]" />
        </div>
        <Skeleton className="aspect-video w-full rounded-xl" />
      </CardContent>
      <EngagementFooterSkeleton />
    </Card>
  );
}

export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <PostHeaderSkeleton />
      <CardContent className={cn(feedCardContentClass, "space-y-3")}>
        <Skeleton className="aspect-[2/1] w-full rounded-xl" />
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-6 w-4/5 max-w-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[88%]" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <EngagementFooterSkeleton />
    </Card>
  );
}

export function ComposerSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <CardContent className={cn(feedCardSectionClass, "space-y-3")}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div className="flex flex-1 items-center justify-around gap-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-22 rounded-md" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeedListSkeleton({
  count = 3,
  withComposer = false,
  className,
}: {
  count?: number;
  withComposer?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-3 skeleton-stagger", className)}>
      {withComposer ? <ComposerSkeleton /> : null}
      {Array.from({ length: count }).map((_, index) =>
        index === 1 ? (
          <ArticleCardSkeleton key={index} />
        ) : (
          <PostCardSkeleton key={index} />
        ),
      )}
    </div>
  );
}

export function SidebarProfileSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Skeleton className="size-18 rounded-full ring-4 ring-card" />
      <Skeleton className="mt-3 h-5 w-32" />
      <Skeleton className="mt-2 h-4 w-full max-w-50" />
      <Skeleton className="mt-1.5 h-4 w-4/5 max-w-45" />
    </div>
  );
}

export function SidebarStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function SidebarLeftSkeleton({ className }: { className?: string }) {
  return (
    <aside className={cn("space-y-4", className)}>
      <Card padding="none" className={feedCardClass}>
        <Skeleton className="h-16 w-full rounded-none" />
        <CardContent className={feedCardSectionClass}>
          <div className="-mt-9">
            <SidebarProfileSkeleton />
          </div>
          <div className="my-4 h-px bg-border" />
          <SidebarStatsSkeleton />
        </CardContent>
      </Card>
      <Card padding="none" className={feedCardClass}>
        <CardContent className="space-y-0 p-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 px-4 py-3 sm:px-5",
                index > 0 && "border-t",
              )}
            >
              <Skeleton className="size-9 shrink-0 rounded-md" />
              <Skeleton className="h-4 flex-1 max-w-30" />
              <Skeleton className="size-4 shrink-0 rounded-sm" />
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function SidebarSuggestedSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <CardHeader className={feedCardTitleClass}>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="divide-y pt-0">
        {Array.from({ length: 3 }).map((_, index) => (
          <UserRowSkeleton key={index} className="px-0 first:pt-0" />
        ))}
      </CardContent>
    </Card>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5 skeleton-stagger", className)}>
      <Card padding="none" className={feedCardClass}>
        <Skeleton className="h-28 w-full rounded-none sm:h-32" />
        <CardContent className={cn(feedCardSectionClass, "space-y-4")}>
          <div className="flex items-start gap-4">
            <Skeleton className="-mt-14 size-24 shrink-0 rounded-full ring-4 ring-card sm:size-28" />
            <div className="min-w-0 flex-1 space-y-3 pt-2 sm:pt-4">
              <Skeleton className="h-7 w-48 max-w-full" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  );
}

export function ProfileEditSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] skeleton-stagger",
        className,
      )}
    >
      <div className="space-y-5">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="size-32 rounded-full" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Card padding="none" className={feedCardClass}>
        <CardContent className={cn(feedCardSectionClass, "space-y-5")}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-10 w-28 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

export function UserRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-19 shrink-0 rounded-md" />
    </div>
  );
}

export function UserListSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("divide-y skeleton-stagger", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <UserRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function CommentComposerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function CommentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2 py-2", className)}>
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="mb-2 flex items-baseline gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[85%]" />
          </div>
        </div>
        <div className="flex gap-3 px-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function CommentListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1 skeleton-stagger", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </div>
  );
}

export function NotificationRowSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 px-4 py-3.5 sm:px-5",
        className,
      )}
    >
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5 max-w-sm" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="size-2 shrink-0 rounded-full bg-primary/30" />
    </div>
  );
}

export function NotificationListSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("divide-y skeleton-stagger", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <NotificationRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function ConversationRowSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2.5", className)}>
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-3/4 max-w-55" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5 skeleton-stagger", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function MessageThreadSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5 py-2 skeleton-stagger", className)}>
      <div className="flex justify-start">
        <Skeleton className="h-12 w-[62%] rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[48%] rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[70%] rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[40%] rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-11 w-[55%] rounded-2xl rounded-bl-md" />
      </div>
    </div>
  );
}

export function FormPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 skeleton-stagger", className)}>
      <Skeleton className="h-8 w-48" />
      <Card padding="none" className={feedCardClass}>
        <CardContent className={cn(feedCardSectionClass, "space-y-4")}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function PageBlockSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("mx-auto h-48 max-w-md rounded-xl", className)}
    />
  );
}
