/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import {
  EmojiPickerButton,
  insertEmojiAtCaret,
} from "@/components/emoji-picker-button";
import { ProfileTrigger } from "@/components/profile-trigger";
import { ReactionButton } from "@/components/reaction-button";
import { UserAvatar } from "@/components/user-avatar";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MentionInput } from "@/components/mention-text-field";
import {
  CommentComposerSkeleton,
  CommentListSkeleton,
} from "@/components/skeletons";
import { appToast } from "@/lib/app-toast";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import type { Comment, ReactionType, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostCommentsProps = {
  postId: string;
  open: boolean;
  initialCount?: number;
  onCountChange?: (count: number) => void;
  className?: string;
};

const PREVIEW_LIMIT = 5;

function updateCommentTree(
  comments: Comment[],
  commentId: string,
  updater: (comment: Comment) => Comment,
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) return updater(comment);
    if (!comment.replies?.length) return comment;
    return {
      ...comment,
      replies: updateCommentTree(comment.replies, commentId, updater),
    };
  });
}

function CommentItem({
  comment,
  postId,
  user,
  isReply = false,
  replyToId,
  onReplyTo,
  onCommentUpdated,
}: {
  comment: Comment;
  postId: string;
  user: User | null;
  isReply?: boolean;
  replyToId: string | null;
  onReplyTo: (id: string | null) => void;
  onCommentUpdated: (
    commentId: string,
    updater: (comment: Comment) => Comment,
  ) => void;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const isReplying = replyToId === comment.id;

  function insertReplyEmoji(emoji: string) {
    const el = replyInputRef.current;
    const { value, caret } = insertEmojiAtCaret(
      replyContent,
      emoji,
      el?.selectionStart,
      el?.selectionEnd,
    );
    setReplyContent(value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  async function handleReact(reaction: ReactionType | null) {
    const result =
      reaction === null
        ? await api.comments.reactions.clear(comment.id)
        : await api.comments.reactions.set(comment.id, reaction);

    onCommentUpdated(comment.id, (current) => ({
      ...current,
      reaction: result.reaction,
      isLiked: result.reaction !== null,
      likes: result.likesCount,
    }));

    return {
      reaction: result.reaction,
      likesCount: result.likesCount,
    };
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { comment: created } = await api.posts.comments.create(postId, {
        content: replyContent,
        parentId: comment.id,
      });
      onCommentUpdated(comment.id, (current) => ({
        ...current,
        replies: [...(current.replies ?? []), created],
      }));
      setReplyContent("");
      onReplyTo(null);
      appToast.success("Reply posted");
    } catch (err) {
      appToast.error(
        "Could not post reply",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("space-y-2", isReply && "ml-10")}>
      <div className="flex gap-2">
        <UserAvatar
          src={comment.author.avatar}
          name={comment.author.name}
          size="sm"
          userId={comment.author.id}
        />
        <div className="min-w-0 flex-1">
          <div className="rounded-xl bg-muted px-3 py-2">
            <div className="flex items-baseline gap-2">
              <ProfileTrigger
                userId={comment.author.id}
                className="text-sm font-semibold hover:underline"
              >
                {comment.author.name}
              </ProfileTrigger>
              <span className="text-xs text-muted-foreground">
                {comment.createdAt}
              </span>
            </div>
            <p className="mt-0.5 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-1 px-1">
            <ReactionButton
              compact
              initialLiked={comment.isLiked}
              initialReaction={comment.reaction}
              initialCount={comment.likes}
              loginNext="/feed"
              onReact={handleReact}
            />
            {!isReply && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onReplyTo(isReplying ? null : comment.id)}
              >
                Reply
              </Button>
            )}
          </div>

          {isReplying && user && (
            <form
              className="mt-2 flex items-start gap-2"
              onSubmit={handleReplySubmit}
            >
              <UserAvatar
                src={user.avatar}
                name={user.name}
                size="sm"
                userId={user.id}
              />
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <MentionInput
                  ref={replyInputRef}
                  placeholder={`Reply to ${comment.author.name}...`}
                  value={replyContent}
                  onValueChange={setReplyContent}
                  disabled={submitting}
                  autoFocus
                  autoComplete="off"
                />
                <EmojiPickerButton
                  disabled={submitting}
                  side="top"
                  align="end"
                  onSelect={insertReplyEmoji}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !replyContent.trim()}
                loading={submitting}
              >
                Reply
              </Button>
            </form>
          )}

          {isReplying && !user && (
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href="/login?next=/feed" className="underline">
                Sign in
              </Link>{" "}
              to reply.
            </p>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          user={user}
          isReply
          replyToId={replyToId}
          onReplyTo={onReplyTo}
          onCommentUpdated={onCommentUpdated}
        />
      ))}
    </div>
  );
}

export function PostComments({
  postId,
  open,
  initialCount = 0,
  onCountChange,
  className,
}: PostCommentsProps) {
  const { user, loading: userLoading } = useCurrentUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  function insertCommentEmoji(emoji: string) {
    const el = commentInputRef.current;
    const { value, caret } = insertEmojiAtCaret(
      content,
      emoji,
      el?.selectionStart,
      el?.selectionEnd,
    );
    setContent(value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }
  const [loaded, setLoaded] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { comments: data } = await api.posts.comments.list(postId);
      setComments(data);
      onCountChange?.(data.length);
      setError(null);
      setLoaded(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load comments."));
    } finally {
      setLoading(false);
    }
  }, [onCountChange, postId]);

  useEffect(() => {
    if (!open || loaded) return;
    void load();
  }, [open, loaded, load]);

  useEffect(() => {
    setLoaded(false);
    setComments([]);
    setShowAll(false);
    setReplyToId(null);
    setError(null);
  }, [postId]);

  function handleCommentUpdated(
    commentId: string,
    updater: (comment: Comment) => Comment,
  ) {
    setComments((current) => updateCommentTree(current, commentId, updater));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { comment: created } = await api.posts.comments.create(postId, {
        content,
      });
      const nextComments = [...comments, created];
      setComments(nextComments);
      onCountChange?.(nextComments.length);
      setContent("");
      appToast.success("Comment posted");
    } catch (err) {
      appToast.error(
        "Could not post comment",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const visibleComments = showAll ? comments : comments.slice(0, PREVIEW_LIMIT);
  const hasMore = comments.length > PREVIEW_LIMIT && !showAll;

  return (
    <div className={cn("space-y-4 border-t px-4 py-3", className)}>
      {userLoading ? (
        <CommentComposerSkeleton />
      ) : user ? (
        <form className="flex items-start gap-2" onSubmit={handleSubmit}>
          <UserAvatar
            src={user.avatar}
            name={user.name}
            size="sm"
            userId={user.id}
          />
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <MentionInput
              ref={commentInputRef}
              placeholder="Add a comment..."
              value={content}
              onValueChange={setContent}
              disabled={submitting}
              autoFocus
              autoComplete="off"
            />
            <EmojiPickerButton
              disabled={submitting}
              side="top"
              align="end"
              onSelect={insertCommentEmoji}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Add image"
              disabled
            >
              <ImageIcon className="size-4" />
            </Button>
          </div>
          {content.trim() ? (
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              loading={submitting}
            >
              Post
            </Button>
          ) : null}
        </form>
      ) : (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Link
            href={`/login?next=/feed`}
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>{" "}
          to add a comment.
        </div>
      )}

      {loading && (
        <CommentListSkeleton count={Math.min(initialCount || 2, 3)} />
      )}

      {error && (
        <Alert variant="error" className="w-full max-w-none">
          <AlertContent>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}

      <div className="space-y-3">
        {visibleComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            user={user}
            replyToId={replyToId}
            onReplyTo={setReplyToId}
            onCommentUpdated={handleCommentUpdated}
          />
        ))}
      </div>

      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          onClick={() => setShowAll(true)}
        >
          Load more comments
        </Button>
      )}
    </div>
  );
}
