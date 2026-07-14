import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
  feedCardSectionClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

export function PostCardSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <CardHeader className={feedCardHeaderClass}>
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className={cn(feedCardContentClass, "space-y-3")}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <CardFooter className={feedCardFooterClass}>
        <div className="flex w-full items-center justify-between gap-2 px-2 py-1 sm:px-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-10 rounded-md" />
            <Skeleton className="h-8 w-10 rounded-md" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-[18px] rounded-full" />
            <Skeleton className="size-[18px] -ml-1.5 rounded-full" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <CardHeader className={feedCardHeaderClass}>
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className={cn(feedCardContentClass, "space-y-3")}>
        <Skeleton className="aspect-[2/1] w-full rounded-lg" />
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-6 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
      <CardFooter className={feedCardFooterClass}>
        <div className="flex w-full items-center justify-between gap-2 px-2 py-1 sm:px-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-10 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function ComposerSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn(feedCardClass, className)}>
      <CardContent className={cn(feedCardSectionClass, "space-y-3")}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
        <div className="flex items-center gap-2 border-t pt-3">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
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
    <div className={cn("min-w-0 space-y-3", className)}>
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

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      <Card padding="none" className={feedCardClass}>
        <CardContent className={cn(feedCardSectionClass, "space-y-4")}>
          <div className="flex items-start gap-4">
            <Skeleton className="size-24 shrink-0 rounded-full sm:size-28" />
            <div className="min-w-0 flex-1 space-y-3 pt-1">
              <Skeleton className="h-7 w-48" />
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
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

export function ProfileEditSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]",
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
        <CardContent className={cn(feedCardSectionClass, "space-y-4")}>
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
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
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
    <div className={cn("divide-y", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <UserRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function CommentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 py-3", className)}>
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex gap-3">
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
    <div className={cn("space-y-1", className)}>
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
    <div className={cn("flex items-center gap-3.5 px-4 py-3.5 sm:px-5", className)}>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="size-2 shrink-0 rounded-full" />
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
    <div className={cn("divide-y", className)}>
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
        <Skeleton className="h-3 w-3/4" />
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
    <div className={cn("space-y-0.5", className)}>
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
    <div className={cn("flex flex-col gap-2.5 py-2", className)}>
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

export function FormPageSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
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

export function PageBlockSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Skeleton className={cn("mx-auto h-48 max-w-md rounded-xl", className)} />
  );
}

export function SidebarProfileSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Skeleton className="size-16 rounded-full" />
      <Skeleton className="mt-2 h-5 w-32" />
      <Skeleton className="mt-2 h-4 w-full" />
    </div>
  );
}
