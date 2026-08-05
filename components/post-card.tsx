"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { PostComments } from "@/components/post-comments";
import { PostEventCard } from "@/components/post-event-card";
import { PostMediaGallery } from "@/components/post-media-gallery";
import { PostCelebrationCard } from "@/components/post-celebration-card";
import { getCelebrationMeta } from "@/lib/celebrations";
import { PostLikeButton } from "@/components/post-like-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  mergeReactionSummary,
  PostEngagementBar,
} from "@/components/post-reaction-summary";
import { ProfileTrigger } from "@/components/profile-trigger";
import { SharePostDialog } from "@/components/share-post-dialog";
import { EditPostDialog } from "@/components/edit-post-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { usePostReactionsRealtime } from "@/hooks/use-post-reactions-realtime";
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
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import type { Post, ReactionType } from "@/lib/types";
import {
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: Post;
  showActions?: boolean;
  canManage?: boolean;
  initialEditOpen?: boolean;
  revealDelay?: number;
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
  revealDelay = 0,
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
  const [reactionSummary, setReactionSummary] = useState<ReactionType[]>(
    post.reactionSummary ?? [],
  );
  const [myReaction, setMyReaction] = useState<ReactionType | null>(
    post.reaction ?? null,
  );
  const [sharesCount, setSharesCount] = useState(post.shares);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLikesCount(post.likes);
    setReactionSummary(post.reactionSummary ?? []);
    setMyReaction(post.reaction ?? null);
    setIsSaved(Boolean(post.isSaved));
    setContent(post.content);
    setCommentsCount(post.comments);
    setSharesCount(post.shares);
  }, [
    post.id,
    post.likes,
    post.isSaved,
    post.reaction,
    post.reactionSummary,
    post.content,
    post.comments,
    post.shares,
  ]);

  usePostReactionsRealtime(post.id, user?.id, ({ likesCount, reactionSummary }) => {
    setLikesCount(likesCount);
    setReactionSummary(reactionSummary);
  });

  async function handleToggleSave() {
    if (!user) {
      appToast.error("Sign in required", "Sign in to save posts.");
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      if (isSaved) {
        await api.posts.unsave(post.id);
        setIsSaved(false);
        appToast.success("Post removed", "Removed from your saved posts.");
        onUnsaved?.(post.id);
      } else {
        await api.posts.save(post.id);
        setIsSaved(true);
        appToast.success("Post saved", "Find it anytime on Saved Posts.");
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

  const galleryImages =
    post.images && post.images.length > 0
      ? post.images
      : post.image
        ? [post.image]
        : [];

  const engagementBar = (
    <PostEngagementBar
      postId={post.id}
      likesCount={likesCount}
      commentsCount={commentsCount}
      sharesCount={sharesCount}
      types={reactionSummary}
      commentsOpen={commentsOpen}
      onOpenComments={() => setCommentsOpen((open) => !open)}
      onRepost={() =>
        appToast.info(
          "Repost coming soon",
          "Repost will be available in a future update.",
        )
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
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className={cn("h-9 justify-start", isSaved && "text-foreground")}
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
      }
    />
  );

  return (
    <ScrollReveal delay={revealDelay}>
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
        {content.trim() &&
        !(post.event && content.trim() === post.event.title) &&
        !(
          post.celebration &&
          content.trim() ===
            getCelebrationMeta(post.celebration.occasion).label
        ) ? (
          <p className="text-base leading-relaxed">{content}</p>
        ) : null}
        {post.event ? <PostEventCard event={post.event} /> : null}
        {post.celebration ? (
          <PostCelebrationCard celebration={post.celebration} />
        ) : null}
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
        ) : galleryImages.length > 0 ? (
          <PostMediaGallery
            images={galleryImages}
            captions={post.imageCaptions}
            title={post.title}
            layout={post.mediaLayout ?? "grid"}
          />
        ) : null}
      </CardContent>
      <CardFooter className={feedCardFooterClass}>{engagementBar}</CardFooter>

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
        sharePath={`/post/${post.id}/comments`}
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
    </ScrollReveal>
  );
}
