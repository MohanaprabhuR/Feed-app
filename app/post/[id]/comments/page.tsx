"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/components/current-user-provider";
import {
  EmojiPickerButton,
  insertEmojiAtCaret,
} from "@/components/emoji-picker-button";
import { PageHeader } from "@/components/page-header";
import { ProfileTrigger } from "@/components/profile-trigger";
import { ReactionButton } from "@/components/reaction-button";
import { UserAvatar } from "@/components/user-avatar";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentListSkeleton } from "@/components/skeletons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { appToast } from "@/lib/app-toast";
import {
  createComment,
  fetchComments,
  setCommentReaction,
  toggleCommentLike,
} from "@/lib/comments";
import { getErrorMessage } from "@/lib/errors";
import { fetchPostById } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import type { Comment, ReactionType, User } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function CommentBlock({
  comment,
  postId,
  user,
  isReply = false,
  replyToId,
  onReplyTo,
  onUpdated,
}: {
  comment: Comment;
  postId: string;
  user: User | null;
  isReply?: boolean;
  replyToId: string | null;
  onReplyTo: (id: string | null) => void;
  onUpdated: (commentId: string, updater: (c: Comment) => Comment) => void;
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
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Sign in to react.");

    const result =
      reaction === null
        ? await toggleCommentLike(supabase, comment.id, authUser.id)
        : await setCommentReaction(supabase, comment.id, authUser.id, reaction);

    onUpdated(comment.id, (current) => ({
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

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const created = await createComment(
        supabase,
        postId,
        user,
        replyContent,
        comment.id,
      );
      onUpdated(comment.id, (current) => ({
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
    <div className={cn("space-y-3", isReply && "ml-10")}>
      <div className="flex gap-3">
        <UserAvatar
          src={comment.author.avatar}
          name={comment.author.name}
          size="sm"
          userId={comment.author.id}
        />
        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-muted p-3">
            <ProfileTrigger
              userId={comment.author.id}
              className="text-sm font-medium hover:underline"
            >
              {comment.author.name}
            </ProfileTrigger>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {comment.createdAt}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <ReactionButton
              compact
              initialLiked={comment.isLiked}
              initialReaction={comment.reaction}
              initialCount={comment.likes}
              loginNext={`/post/${postId}/comments`}
              onReact={handleReact}
            />
            {!isReply && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onReplyTo(isReplying ? null : comment.id)}
              >
                Reply
              </Button>
            )}
          </div>

          {isReplying && user && (
            <form className="mt-2 flex gap-2" onSubmit={handleReply}>
              <div className="relative min-w-0 flex-1">
                <Input
                  ref={replyInputRef}
                  placeholder={`Reply to ${comment.author.name}...`}
                  className="pr-10"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
                <div className="absolute inset-y-0 right-1 flex items-center">
                  <EmojiPickerButton
                    disabled={submitting}
                    side="top"
                    align="end"
                    onSelect={insertReplyEmoji}
                  />
                </div>
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
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentBlock
          key={reply.id}
          comment={reply}
          postId={postId}
          user={user}
          isReply
          replyToId={replyToId}
          onReplyTo={onReplyTo}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

export default function CommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: userLoading } = useCurrentUser();
  const userId = user?.id;
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingPost, setMissingPost] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const post = await fetchPostById(supabase, id);
      if (!post) {
        setMissingPost(true);
        setComments([]);
        setError(null);
        return;
      }

      const data = await fetchComments(supabase, id, { userId });
      setComments(data);
      setMissingPost(false);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load comments."));
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      appToast.error("Sign in required", "Sign in to post a comment.");
      return;
    }
    if (!content.trim() || submitting || missingPost) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const created = await createComment(supabase, id, user, content);
      setComments((current) => [...current, created]);
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

  return (
    <AppShell noPadding className="flex flex-col">
      <PageHeader title="Comments" backHref="/feed" />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loading && <CommentListSkeleton count={3} />}

        {error && (
          <Alert variant="error" className="w-full max-w-none">
            <AlertContent>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
          </Alert>
        )}

        {!loading && missingPost && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>Post not found</EmptyTitle>
              <EmptyDescription>
                This post may have been deleted.
              </EmptyDescription>
              <Button asChild size="sm">
                <Link href="/feed">Back to feed</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!loading && !error && !missingPost && comments.length === 0 && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No comments yet</EmptyTitle>
              <EmptyDescription>
                Start the conversation with the first comment.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        )}

        {comments.map((comment) => (
          <CommentBlock
            key={comment.id}
            comment={comment}
            postId={id}
            user={user}
            replyToId={replyToId}
            onReplyTo={setReplyToId}
            onUpdated={(commentId, updater) =>
              setComments((current) =>
                updateCommentTree(current, commentId, updater),
              )
            }
          />
        ))}
      </div>

      <div className="sticky bottom-16 z-10 border-t bg-background p-4 md:bottom-0">
        {userLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : user ? (
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <div className="relative min-w-0 flex-1">
              <Input
                ref={commentInputRef}
                placeholder="Write a comment..."
                className="pr-10"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting || missingPost}
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-1 flex items-center">
                <EmojiPickerButton
                  disabled={submitting || missingPost}
                  side="top"
                  align="end"
                  onSelect={insertCommentEmoji}
                />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim() || missingPost}
              loading={submitting}
              aria-label="Post comment"
            >
              <Send className="size-4" />
              Post
            </Button>
          </form>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/login?next=/post/${id}/comments`}>
              Sign in to comment
            </Link>
          </Button>
        )}
      </div>
    </AppShell>
  );
}
