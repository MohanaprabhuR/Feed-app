"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Newspaper,
} from "lucide-react";
import { getArticleExcerpt, getReadTimeMinutes } from "@/lib/articles";
import { useCurrentUser } from "@/components/current-user-provider";
import { PostComments } from "@/components/post-comments";
import { PostLikeButton } from "@/components/post-like-button";
import {
  mergeReactionSummary,
  PostEngagementBar,
} from "@/components/post-reaction-summary";
import { ProfileTrigger } from "@/components/profile-trigger";
import { SharePostDialog } from "@/components/share-post-dialog";
import { EditPostDialog } from "@/components/edit-post-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
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
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import { toggleSavePost } from "@/lib/saves";
import { createClient } from "@/lib/supabase/client";
import type { Post, ReactionType } from "@/lib/types";
import {
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

type ArticleCardProps = {
  post: Post;
  showActions?: boolean;
  canManage?: boolean;
  initialEditOpen?: boolean;
  onUnsaved?: (postId: string) => void;
  onUpdated?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
  onEditClose?: () => void;
};

export function ArticleCard({
  post,
  showActions = true,
  canManage,
  initialEditOpen = false,
  onUnsaved,
  onUpdated,
  onDeleted,
  onEditClose,
}: ArticleCardProps) {
  const { user } = useCurrentUser();
  const isOwnPost = canManage ?? Boolean(user?.id && user.id === post.author.id);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(initialEditOpen);
  const [content, setContent] = useState(post.content);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [reactionSummary, setReactionSummary] = useState<ReactionType[]>(
    post.reactionSummary ?? [],
  );
  const [myReaction, setMyReaction] = useState<ReactionType | null>(
    post.reaction ?? null,
  );
  const [sharesCount, setSharesCount] = useState(post.shares);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [saving, setSaving] = useState(false);
  const readTime = getReadTimeMinutes(content);
  const excerpt = getArticleExcerpt(content);

  useEffect(() => {
    setLikesCount(post.likes);
    setReactionSummary(post.reactionSummary ?? []);
    setMyReaction(post.reaction ?? null);
    setIsSaved(Boolean(post.isSaved));
  }, [post.id, post.likes, post.isSaved, post.reaction, post.reactionSummary]);

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
        appToast.success("Article saved", "Find it anytime on Saved Posts.");
      } else {
        appToast.success("Article removed", "Removed from your saved posts.");
        onUnsaved?.(post.id);
      }
    } catch (err) {
      appToast.error(
        "Could not update saved article",
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
              {isOwnPost ? (
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  Edit article
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={`/articles/${post.id}`}>View article</Link>
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
                {isSaved ? "Unsave article" : "Save article"}
              </DropdownMenuItem>
              {!isOwnPost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" asChild>
                    <Link href={`/report/${post.id}`}>Report</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className={feedCardContentClass}>
        <Link href={`/articles/${post.id}`} className="group block space-y-3">
          {post.image && (
            <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-muted">
              <Image
                src={post.image}
                alt={post.title ?? "Article cover"}
                fill
                unoptimized={post.image.includes("/storage/v1/object/public/")}
                className="object-cover transition-transform group-hover:scale-[1.01]"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}

          <div className="space-y-2">
            <Badge variant="outline" theme="amber" size="md">
              <Newspaper className="size-3.5" />
              Article · {readTime} min read
            </Badge>
            <h3 className="text-xl font-bold leading-snug group-hover:underline">
              {post.title || "Untitled article"}
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          </div>
        </Link>
      </CardContent>

      <CardFooter className={feedCardFooterClass}>
        <PostEngagementBar
          postId={post.id}
          likesCount={likesCount}
          commentsCount={commentsCount}
          sharesCount={sharesCount}
          types={reactionSummary}
          commentsOpen={commentsOpen}
          onOpenComments={() => setCommentsOpen((open) => !open)}
          onRepost={() =>
            appToast.info("Repost coming soon", "Repost will be available in a future update.")
          }
          onShare={() => setShareOpen(true)}
          likeControl={
            <PostLikeButton
              postId={post.id}
              initialLiked={Boolean(myReaction)}
              initialReaction={myReaction}
              initialCount={likesCount}
              hideCount
              className="justify-start"
              onCountChange={setLikesCount}
              onReactionChange={(next, count) => {
                setMyReaction((prev) => {
                  setReactionSummary((current) =>
                    mergeReactionSummary(current, prev, next, count),
                  );
                  return next;
                });
              }}
            />
          }
          trailing={
            <>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                className={cn("h-9 justify-start", isSaved && "text-foreground")}
                aria-label={isSaved ? "Unsave article" : "Save article"}
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
              <Button
                variant="outline"
                size="sm"
                className="h-auto px-2 py-0.5 text-xs"
                asChild
              >
                <Link href={`/articles/${post.id}`}>Read more</Link>
              </Button>
            </>
          }
        />
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
        sharePath={`/articles/${post.id}`}
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
