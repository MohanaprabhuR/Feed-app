"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { PostComments } from "@/components/post-comments";
import { PostLikeButton } from "@/components/post-like-button";
import { ProfileTrigger } from "@/components/profile-trigger";
import { SharePostDialog } from "@/components/share-post-dialog";
import { EditPostDialog } from "@/components/edit-post-dialog";
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
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import { toggleSavePost } from "@/lib/saves";
import { createClient } from "@/lib/supabase/client";
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

type PostCardProps = {
  post: Post;
  showActions?: boolean;
  canManage?: boolean;
  initialEditOpen?: boolean;
  onUnsaved?: (postId: string) => void;
  onUpdated?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
  onEditClose?: () => void;
};

export function PostCard({
  post,
  showActions = true,
  canManage,
  initialEditOpen = false,
  onUnsaved,
  onUpdated,
  onDeleted,
  onEditClose,
}: PostCardProps) {
  const { user } = useCurrentUser();
  const isOwnPost = canManage ?? Boolean(user?.id && user.id === post.author.id);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(initialEditOpen);
  const [content, setContent] = useState(post.content);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [sharesCount, setSharesCount] = useState(post.shares);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [saving, setSaving] = useState(false);

  async function handleToggleSave() {
    if (!user) {
      appToast.error("Sign in required", "Sign in to save posts.");
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const next = await toggleSavePost(supabase, user.id, post.id, isSaved);
      setIsSaved(next);
      if (next) {
        appToast.success("Post saved", "Find it anytime on Saved Posts.");
      } else {
        appToast.success("Post removed", "Removed from your saved posts.");
        onUnsaved?.(post.id);
      }
    } catch (err) {
      appToast.error(
        "Could not update saved post",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setSaving(false);
    }
  }

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
              {isOwnPost && (
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                >
                  Edit post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={saving}
                onClick={() => void handleToggleSave()}
              >
                {isSaved ? (
                  <BookmarkCheck className="size-4" />
                ) : (
                  <Bookmark className="size-4" />
                )}
                {isSaved ? "Unsave post" : "Save post"}
              </DropdownMenuItem>
              {!isOwnPost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" asChild>
                    <Link href={`/report/${post.id}`}>Report post</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className={feedCardContentClass}>
        <p className="text-base leading-relaxed">{content}</p>
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
              appToast.info("Repost coming soon", "Repost will be available in a future update.")
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
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={cn(
              "ml-auto h-9 justify-start",
              isSaved && "text-foreground",
            )}
            aria-label={isSaved ? "Unsave post" : "Save post"}
            aria-pressed={isSaved}
            disabled={saving}
            onClick={() => void handleToggleSave()}
          >
            {isSaved ? (
              <BookmarkCheck className="size-4 fill-current" />
            ) : (
              <Bookmark className="size-4" />
            )}
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

      {isOwnPost && editOpen && (
        <EditPostDialog
          post={{ ...post, content }}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) onEditClose?.();
          }}
          onUpdated={(updated) => {
            setContent(updated.content);
            onUpdated?.(updated);
          }}
          onDeleted={(postId) => {
            onDeleted?.(postId);
          }}
        />
      )}
    </Card>
  );
}
