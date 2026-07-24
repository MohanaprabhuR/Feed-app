"use client";

import { ReactionButton } from "@/components/reaction-button";
import { api } from "@/lib/api-client";
import type { ReactionType } from "@/lib/types";

type PostLikeButtonProps = {
  postId: string;
  initialLiked?: boolean;
  initialReaction?: ReactionType | null;
  initialCount: number;
  hideCount?: boolean;
  className?: string;
  onCountChange?: (count: number) => void;
  onReactionChange?: (
    reaction: ReactionType | null,
    likesCount: number,
  ) => void;
};

export function PostLikeButton({
  postId,
  initialLiked = false,
  initialReaction = null,
  initialCount,
  hideCount = false,
  className,
  onCountChange,
  onReactionChange,
}: PostLikeButtonProps) {
  return (
    <ReactionButton
      className={className}
      hideCount={hideCount}
      initialLiked={initialLiked}
      initialReaction={initialReaction}
      initialCount={initialCount}
      loginNext={`/feed`}
      countHref={hideCount ? undefined : `/post/${postId}/likes`}
      onOptimisticChange={(reaction, likesCount) => {
        onCountChange?.(likesCount);
        onReactionChange?.(reaction, likesCount);
      }}
      onReact={async (reaction) => {
        const result =
          reaction === null
            ? await api.posts.reactions.clear(postId)
            : await api.posts.reactions.set(postId, reaction);

        onCountChange?.(result.likesCount);
        onReactionChange?.(result.reaction, result.likesCount);
        return { reaction: result.reaction, likesCount: result.likesCount };
      }}
    />
  );
}
