"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PostComments } from "@/components/post-comments";
import { PostLikeButton } from "@/components/post-like-button";
import { ProfileTrigger } from "@/components/profile-trigger";
import { SharePostDialog } from "@/components/share-post-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { Post } from "@/lib/types";
import {
  feedCardActionsClass,
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
  feedCardStatsClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription, AlertContent } from "./ui/alert";

type PostCardProps = {
  post: Post;
  showActions?: boolean;
};

export function PostCard({ post, showActions = true }: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [sharesCount, setSharesCount] = useState(post.shares);

  return (
    <Card padding="none" className={feedCardClass}>
      <CardHeader className={feedCardHeaderClass}>
        <UserAvatar
          src={post.author.avatar}
          name={post.author.name}
          userId={post.author.id}
        />
        <div className="min-w-0 flex-1">
          <ProfileTrigger
            userId={post.author.id}
            className="font-semibold hover:underline"
          >
            {post.author.name}
          </ProfileTrigger>
          <p className="text-sm text-muted-foreground">
            @{post.author.username} · {post.createdAt}
          </p>
        </div>
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" iconOnly>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/edit/${post.id}`}>Edit post</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast.custom((t) => (
                    <Alert variant="success">
                      <AlertContent>
                        <AlertTitle>Post saved to bookmarks</AlertTitle>
                        <AlertDescription>
                          You have saved the post to your bookmarks.
                        </AlertDescription>
                      </AlertContent>
                    </Alert>
                  ))
                }
              >
                <Bookmark className="size-4" />
                Save post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" asChild>
                <Link href={`/report/${post.id}`}>Report post</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className={feedCardContentClass}>
        <p className="text-base leading-relaxed">{post.content}</p>
        {post.video ? (
          <video
            src={post.video}
            controls
            playsInline
            className="aspect-video w-full rounded-lg bg-black"
          />
        ) : post.file ? (
          <Item asChild variant="outline" size="sm">
            <a href={post.file.url} target="_blank" rel="noopener noreferrer">
              <ItemMedia variant="icon">
                <FileText className="text-violet-primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{post.file.name}</ItemTitle>
                <ItemDescription>Download attachment</ItemDescription>
              </ItemContent>
            </a>
          </Item>
        ) : post.image ? (
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image
              src={post.image}
              alt="Post image"
              fill
              unoptimized={post.image.includes("/storage/v1/object/public/")}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        ) : null}
      </CardContent>
      <CardFooter className={feedCardFooterClass}>
        {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
          <div className={feedCardStatsClass}>
            <Link
              href={`/post/${post.id}/likes`}
              className="hover:text-foreground hover:underline"
            >
              {likesCount > 0
                ? `${likesCount} reaction${likesCount === 1 ? "" : "s"}`
                : null}
            </Link>
            <div className="flex items-center gap-2">
              {commentsCount > 0 && (
                <button
                  type="button"
                  className="hover:text-foreground hover:underline"
                  onClick={() => setCommentsOpen(true)}
                >
                  {commentsCount} comment{commentsCount === 1 ? "" : "s"}
                </button>
              )}
              {sharesCount > 0 && <span>{sharesCount} shares</span>}
            </div>
          </div>
        )}

        <div className={feedCardActionsClass}>
          <PostLikeButton
            postId={post.id}
            initialLiked={post.isLiked}
            initialReaction={post.reaction}
            initialCount={likesCount}
            hideCount
            className="justify-start"
            onCountChange={setLikesCount}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={cn("h-9 justify-start", commentsOpen && "bg-accent")}
            aria-expanded={commentsOpen}
            aria-label="Toggle comments"
            onClick={() => setCommentsOpen((open) => !open)}
          >
            <MessageCircle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="h-9 justify-start"
            aria-label="Repost"
            onClick={() =>
              toast.custom(() => (
                <Alert variant="success">
                  <AlertContent>
                    <AlertTitle>Repost coming soon</AlertTitle>
                    <AlertDescription>
                      Repost will be available in a future update.
                    </AlertDescription>
                  </AlertContent>
                </Alert>
              ))
            }
          >
            <Repeat2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="h-9 justify-start"
            aria-label="Share post"
            onClick={() => setShareOpen(true)}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardFooter>

      <PostComments
        postId={post.id}
        open={commentsOpen}
        initialCount={commentsCount}
        onCountChange={setCommentsCount}
      />

      <SharePostDialog
        postId={post.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
        sharePath={`/feed`}
        onShared={setSharesCount}
      />
    </Card>
  );
}
