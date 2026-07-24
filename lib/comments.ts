import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultAvatar } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/posts";
import { profileToUser, type ProfileRow } from "@/lib/profile";
import type { Comment, ReactionType, User } from "@/lib/types";

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author_id: string;
  likes_count?: number | null;
};

const REACTION_TYPES: ReactionType[] = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
];

const commentColumnsWithLikes =
  "id, content, created_at, parent_id, author_id, likes_count";
const commentColumnsLegacy = "id, content, created_at, parent_id, author_id";

function isMissingCommentsTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("comments") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find the table") ||
      lower.includes("could not find the relation"))
  );
}

function isMissingCommentLikesError(message: string) {
  const lower = message.toLowerCase();
  return (
    (lower.includes("comment_likes") || lower.includes("likes_count")) &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find") ||
      lower.includes("column"))
  );
}

function isMissingCommentReactionError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("reaction") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find") ||
      lower.includes("column"))
  );
}

function formatCommentError(message: string) {
  if (isMissingCommentsTableError(message)) {
    return "Comments need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.";
  }

  if (isMissingCommentReactionError(message)) {
    return "Comment reactions need database setup. Run supabase/migrate-comment-reactions.sql in Supabase → SQL Editor.";
  }

  if (isMissingCommentLikesError(message)) {
    return "Comment likes need database setup. Run supabase/migrate-comment-likes.sql in Supabase → SQL Editor.";
  }

  if (message.toLowerCase().includes("row-level security")) {
    return "Could not save comment. Make sure you are signed in, then try again.";
  }

  if (
    message.toLowerCase().includes("foreign key") ||
    message.toLowerCase().includes("violates foreign key")
  ) {
    return "Your profile is missing. Sign out and sign back in, then try again.";
  }

  return message;
}

function normalizeReaction(value: unknown): ReactionType {
  return REACTION_TYPES.includes(value as ReactionType)
    ? (value as ReactionType)
    : "like";
}

async function fetchProfilesByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, User>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, User>();
  if (uniqueIds.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, username, avatar, bio, followers_count, following_count, posts_count"
    )
    .in("id", uniqueIds);

  if (error) throw error;

  for (const row of (data as ProfileRow[] | null) ?? []) {
    map.set(row.id, profileToUser(row));
  }

  return map;
}

async function fetchUserCommentReactions(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  commentIds: string[]
): Promise<Map<string, ReactionType>> {
  const map = new Map<string, ReactionType>();
  if (!userId || commentIds.length === 0) return map;

  const withReaction = await supabase
    .from("comment_likes")
    .select("comment_id, reaction")
    .eq("user_id", userId)
    .in("comment_id", commentIds);

  if (!withReaction.error) {
    for (const row of withReaction.data ?? []) {
      map.set(row.comment_id as string, normalizeReaction(row.reaction));
    }
    return map;
  }

  if (isMissingCommentLikesError(withReaction.error.message)) return map;

  if (!isMissingCommentReactionError(withReaction.error.message)) {
    throw withReaction.error;
  }

  const legacy = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("user_id", userId)
    .in("comment_id", commentIds);

  if (legacy.error) {
    if (isMissingCommentLikesError(legacy.error.message)) return map;
    throw legacy.error;
  }

  for (const row of legacy.data ?? []) {
    map.set(row.comment_id as string, "like");
  }

  return map;
}

function toComment(
  row: CommentRow,
  author: User,
  options: {
    replies?: Comment[];
    isLiked?: boolean;
    reaction?: ReactionType | null;
  } = {}
): Comment {
  const reaction = options.reaction ?? null;
  return {
    id: row.id,
    author,
    content: row.content,
    createdAt: formatRelativeTime(row.created_at),
    likes: row.likes_count ?? 0,
    isLiked: options.isLiked ?? reaction !== null,
    reaction,
    parentId: row.parent_id,
    replies: options.replies ?? [],
  };
}

function fallbackAuthor(authorId: string): User {
  return {
    id: authorId,
    name: "User",
    username: "user",
    avatar: getDefaultAvatar(authorId),
    bio: "",
    followers: 0,
    following: 0,
    posts: 0,
  };
}

async function ensureProfile(supabase: SupabaseClient, author: User) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", author.id)
    .maybeSingle();

  if (existingProfile) return;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: author.id,
      name: author.name,
      username: author.username,
      avatar: author.avatar,
      bio: author.bio || "",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(formatCommentError(profileError.message));
  }
}

async function getCommentLikesCount(
  supabase: SupabaseClient,
  commentId: string
) {
  const { data, error } = await supabase
    .from("comments")
    .select("likes_count")
    .eq("id", commentId)
    .single();

  if (error) {
    if (isMissingCommentLikesError(error.message)) return 0;
    throw new Error(formatCommentError(error.message));
  }

  return data.likes_count ?? 0;
}

export async function fetchComments(
  supabase: SupabaseClient,
  postId: string,
  options: { userId?: string | null } = {}
): Promise<Comment[]> {
  let rows: CommentRow[] = [];

  const withLikes = await supabase
    .from("comments")
    .select(commentColumnsWithLikes)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (withLikes.error) {
    if (isMissingCommentLikesError(withLikes.error.message)) {
      const legacy = await supabase
        .from("comments")
        .select(commentColumnsLegacy)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (legacy.error) {
        throw new Error(formatCommentError(legacy.error.message));
      }
      rows = (legacy.data as CommentRow[] | null) ?? [];
    } else {
      throw new Error(formatCommentError(withLikes.error.message));
    }
  } else {
    rows = (withLikes.data as CommentRow[] | null) ?? [];
  }

  if (rows.length === 0) return [];

  const profiles = await fetchProfilesByIds(
    supabase,
    rows.map((row) => row.author_id)
  );
  const reactions = await fetchUserCommentReactions(
    supabase,
    options.userId,
    rows.map((row) => row.id)
  );

  const topLevel = rows.filter((row) => row.parent_id == null);
  const replies = rows.filter((row) => row.parent_id != null);

  const repliesByParent = new Map<string, Comment[]>();
  for (const row of replies) {
    if (!row.parent_id) continue;
    const author = profiles.get(row.author_id) ?? fallbackAuthor(row.author_id);
    const reaction = reactions.get(row.id) ?? null;
    const list = repliesByParent.get(row.parent_id) ?? [];
    list.push(
      toComment(row, author, {
        reaction,
        isLiked: reaction !== null,
      })
    );
    repliesByParent.set(row.parent_id, list);
  }

  return topLevel.map((row) => {
    const author = profiles.get(row.author_id) ?? fallbackAuthor(row.author_id);
    const reaction = reactions.get(row.id) ?? null;
    return toComment(row, author, {
      reaction,
      isLiked: reaction !== null,
      replies: repliesByParent.get(row.id) ?? [],
    });
  });
}

export async function createComment(
  supabase: SupabaseClient,
  postId: string,
  author: User,
  content: string,
  parentId?: string
): Promise<Comment> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  await ensureProfile(supabase, author);

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("comments")
      .select("id, post_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError) {
      throw new Error(formatCommentError(parentError.message));
    }
    if (!parent || parent.post_id !== postId) {
      throw new Error("Reply target was not found on this post.");
    }
    if (parent.parent_id) {
      throw new Error("Only one level of replies is supported.");
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: author.id,
      content: trimmed,
      parent_id: parentId ?? null,
    })
    .select(commentColumnsLegacy)
    .single();

  if (error) {
    throw new Error(formatCommentError(error.message));
  }

  return toComment(data as CommentRow, author, {
    isLiked: false,
    reaction: null,
    replies: [],
  });
}

export async function setCommentReaction(
  supabase: SupabaseClient,
  commentId: string,
  userId: string,
  reaction: ReactionType
): Promise<{ reaction: ReactionType | null; likesCount: number }> {
  const { data: existing, error: existingError } = await supabase
    .from("comment_likes")
    .select("comment_id, reaction")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    if (isMissingCommentReactionError(existingError.message)) {
      const legacy = await toggleCommentLike(supabase, commentId, userId);
      return {
        reaction: legacy.liked ? "like" : null,
        likesCount: legacy.likesCount,
      };
    }
    throw new Error(formatCommentError(existingError.message));
  }

  if (existing && normalizeReaction(existing.reaction) === reaction) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (error) throw new Error(formatCommentError(error.message));
    return {
      reaction: null,
      likesCount: await getCommentLikesCount(supabase, commentId),
    };
  }

  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .update({ reaction })
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (error) throw new Error(formatCommentError(error.message));
    return {
      reaction,
      likesCount: await getCommentLikesCount(supabase, commentId),
    };
  }

  const { error } = await supabase.from("comment_likes").insert({
    comment_id: commentId,
    user_id: userId,
    reaction,
  });

  if (error) {
    if (isMissingCommentReactionError(error.message)) {
      const { error: legacyError } = await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: userId,
      });
      if (legacyError) throw new Error(formatCommentError(legacyError.message));
      return {
        reaction: "like",
        likesCount: await getCommentLikesCount(supabase, commentId),
      };
    }
    throw new Error(formatCommentError(error.message));
  }

  return {
    reaction,
    likesCount: await getCommentLikesCount(supabase, commentId),
  };
}

export async function toggleCommentLike(
  supabase: SupabaseClient,
  commentId: string,
  userId: string
): Promise<{
  liked: boolean;
  likesCount: number;
  reaction: ReactionType | null;
}> {
  const { data: existing, error: existingError } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(formatCommentError(existingError.message));
  }

  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (error) throw new Error(formatCommentError(error.message));
    return {
      liked: false,
      reaction: null,
      likesCount: await getCommentLikesCount(supabase, commentId),
    };
  }

  const insertWithReaction = await supabase.from("comment_likes").insert({
    comment_id: commentId,
    user_id: userId,
    reaction: "like",
  });

  if (insertWithReaction.error) {
    if (isMissingCommentReactionError(insertWithReaction.error.message)) {
      const { error } = await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: userId,
      });
      if (error) throw new Error(formatCommentError(error.message));
    } else {
      throw new Error(formatCommentError(insertWithReaction.error.message));
    }
  }

  return {
    liked: true,
    reaction: "like",
    likesCount: await getCommentLikesCount(supabase, commentId),
  };
}
