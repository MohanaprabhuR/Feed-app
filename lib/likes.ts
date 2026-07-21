import type { SupabaseClient } from "@supabase/supabase-js";
import { profileToUser, type ProfileRow } from "@/lib/profile";
import type { ReactionType, User } from "@/lib/types";

export const REACTIONS: {
  type: ReactionType;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}[] = [
  {
    type: "like",
    label: "Like",
    emoji: "👍",
    color: "text-sky-700",
    bg: "bg-sky-100",
  },
  {
    type: "celebrate",
    label: "Celebrate",
    emoji: "👏",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  {
    type: "support",
    label: "Support",
    emoji: "🤝",
    color: "text-violet-700",
    bg: "bg-violet-100",
  },
  {
    type: "love",
    label: "Love",
    emoji: "❤️",
    color: "text-rose-700",
    bg: "bg-rose-100",
  },
  {
    type: "insightful",
    label: "Insightful",
    emoji: "💡",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  {
    type: "funny",
    label: "Funny",
    emoji: "😂",
    color: "text-cyan-700",
    bg: "bg-cyan-100",
  },
];

export function getReactionMeta(type: ReactionType | null | undefined) {
  return REACTIONS.find((reaction) => reaction.type === type) ?? REACTIONS[0];
}

function isMissingLikesTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("post_likes") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

function isMissingReactionColumnError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("reaction") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find") ||
      lower.includes("column"))
  );
}

function normalizeReaction(value: unknown): ReactionType {
  const match = REACTIONS.find((reaction) => reaction.type === value);
  return match?.type ?? "like";
}

/** Top reaction types per post for LinkedIn-style feed stats. */
export async function fetchReactionSummaries(
  supabase: SupabaseClient,
  postIds: string[],
  limitPerPost = 3,
): Promise<Map<string, ReactionType[]>> {
  const map = new Map<string, ReactionType[]>();
  if (postIds.length === 0) return map;

  const withReaction = await supabase
    .from("post_likes")
    .select("post_id, reaction")
    .in("post_id", postIds);

  if (withReaction.error) {
    if (isMissingLikesTableError(withReaction.error.message)) return map;
    if (!isMissingReactionColumnError(withReaction.error.message)) {
      throw withReaction.error;
    }

    // Legacy rows: treat every like as "like".
    for (const id of postIds) map.set(id, ["like"]);
    return map;
  }

  const counts = new Map<string, Map<ReactionType, number>>();
  for (const row of withReaction.data ?? []) {
    const postId = row.post_id as string;
    const type = normalizeReaction(row.reaction);
    if (!counts.has(postId)) counts.set(postId, new Map());
    const byType = counts.get(postId)!;
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }

  for (const [postId, byType] of counts) {
    const ranked = [...byType.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitPerPost)
      .map(([type]) => type);
    map.set(postId, ranked);
  }

  return map;
}

/** Current aggregate reaction state for a single post, for live sync. */
export async function fetchReactionState(
  supabase: SupabaseClient,
  postId: string,
): Promise<{ likesCount: number; reactionSummary: ReactionType[] }> {
  const [likesCount, summaries] = await Promise.all([
    getLikesCount(supabase, postId),
    fetchReactionSummaries(supabase, [postId]),
  ]);

  return {
    likesCount,
    reactionSummary: summaries.get(postId) ?? [],
  };
}

export async function fetchUserReactions(
  supabase: SupabaseClient,
  userId: string,
  postIds: string[],
): Promise<Map<string, ReactionType>> {
  const map = new Map<string, ReactionType>();
  if (!userId || postIds.length === 0) return map;

  const withReaction = await supabase
    .from("post_likes")
    .select("post_id, reaction")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (!withReaction.error) {
    for (const row of withReaction.data ?? []) {
      map.set(row.post_id as string, normalizeReaction(row.reaction));
    }
    return map;
  }

  if (isMissingLikesTableError(withReaction.error.message)) return map;

  if (!isMissingReactionColumnError(withReaction.error.message)) {
    throw withReaction.error;
  }

  const legacy = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (legacy.error) {
    if (isMissingLikesTableError(legacy.error.message)) return map;
    throw legacy.error;
  }

  for (const row of legacy.data ?? []) {
    map.set(row.post_id as string, "like");
  }

  return map;
}

/** @deprecated Prefer fetchUserReactions */
export async function fetchLikedPostIds(
  supabase: SupabaseClient,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  const reactions = await fetchUserReactions(supabase, userId, postIds);
  return new Set(reactions.keys());
}

async function getLikesCount(supabase: SupabaseClient, postId: string) {
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("likes_count")
    .eq("id", postId)
    .single();

  if (postError) throw postError;
  return post.likes_count ?? 0;
}

function isMissingReactionFunctionError(message: string) {
  const lower = message.toLowerCase();
  return (
    (lower.includes("set_post_reaction") ||
      lower.includes("clear_post_reaction")) &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

/**
 * Sets a user's reaction on a post via the set_post_reaction Postgres
 * function (supabase/migrate-reaction-transaction.sql), which does the
 * check-then-upsert-then-count read atomically in a single round trip
 * instead of the multi-step client logic in setReactionLegacy — that
 * approach had a TOCTOU race where concurrent clicks on the same
 * post/user could interleave and leave inconsistent state.
 */
export async function setReaction(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
  reaction: ReactionType,
): Promise<{ reaction: ReactionType | null; likesCount: number }> {
  const { data, error } = await supabase
    .rpc("set_post_reaction", {
      p_post_id: postId,
      p_user_id: userId,
      p_reaction: reaction,
    })
    .single();

  if (error) {
    if (isMissingReactionFunctionError(error.message)) {
      return setReactionLegacy(supabase, postId, userId, reaction);
    }
    if (isMissingReactionColumnError(error.message)) {
      const legacy = await toggleLike(supabase, postId, userId);
      return {
        reaction: legacy.liked ? "like" : null,
        likesCount: legacy.likesCount,
      };
    }
    if (isMissingLikesTableError(error.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }
    throw error;
  }

  const row = data as { reaction: string | null; likes_count: number };
  return {
    reaction: row.reaction ? normalizeReaction(row.reaction) : null,
    likesCount: row.likes_count ?? 0,
  };
}

export async function clearReaction(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
): Promise<{ reaction: null; likesCount: number }> {
  const { data, error } = await supabase.rpc("clear_post_reaction", {
    p_post_id: postId,
    p_user_id: userId,
  });

  if (error) {
    if (isMissingReactionFunctionError(error.message)) {
      return clearReactionLegacy(supabase, postId, userId);
    }
    if (isMissingLikesTableError(error.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }
    throw error;
  }

  return { reaction: null, likesCount: (data as number) ?? 0 };
}

/** Pre-transaction fallback, used until migrate-reaction-transaction.sql is applied. */
async function setReactionLegacy(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
  reaction: ReactionType,
): Promise<{ reaction: ReactionType | null; likesCount: number }> {
  const { data: existing, error: existingError } = await supabase
    .from("post_likes")
    .select("post_id, reaction")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    if (isMissingReactionColumnError(existingError.message)) {
      const legacy = await toggleLike(supabase, postId, userId);
      return {
        reaction: legacy.liked ? "like" : null,
        likesCount: legacy.likesCount,
      };
    }

    if (isMissingLikesTableError(existingError.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }
    throw existingError;
  }

  // Clicking the same reaction again removes it.
  if (existing && normalizeReaction(existing.reaction) === reaction) {
    return clearReactionLegacy(supabase, postId, userId);
  }

  // Prefer upsert so create + change reaction both persist the type.
  const { error } = await supabase.from("post_likes").upsert(
    {
      post_id: postId,
      user_id: userId,
      reaction,
    },
    { onConflict: "post_id,user_id" },
  );

  if (error) {
    if (isMissingReactionColumnError(error.message)) {
      throw new Error(
        "Reactions need database setup. Run supabase/migrate-reactions.sql in Supabase → SQL Editor.",
      );
    }

    if (isMissingLikesTableError(error.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }

    // Fall back to update/insert if upsert isn't available.
    if (existing) {
      const { error: updateError } = await supabase
        .from("post_likes")
        .update({ reaction })
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
        reaction,
      });
      if (insertError) throw insertError;
    }
  }

  return { reaction, likesCount: await getLikesCount(supabase, postId) };
}

async function clearReactionLegacy(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
): Promise<{ reaction: null; likesCount: number }> {
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    if (isMissingLikesTableError(error.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }
    throw error;
  }

  return {
    reaction: null,
    likesCount: await getLikesCount(supabase, postId),
  };
}

export async function toggleLike(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
): Promise<{
  liked: boolean;
  likesCount: number;
  reaction: ReactionType | null;
}> {
  const { data: existing, error: existingError } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    if (isMissingLikesTableError(existingError.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }
    throw existingError;
  }

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return {
      liked: false,
      reaction: null,
      likesCount: await getLikesCount(supabase, postId),
    };
  }

  const insertWithReaction = await supabase.from("post_likes").insert({
    post_id: postId,
    user_id: userId,
    reaction: "like",
  });

  if (insertWithReaction.error) {
    if (isMissingReactionColumnError(insertWithReaction.error.message)) {
      const { error } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });
      if (error) throw error;
    } else if (isMissingLikesTableError(insertWithReaction.error.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    } else {
      throw insertWithReaction.error;
    }
  }

  return {
    liked: true,
    reaction: "like",
    likesCount: await getLikesCount(supabase, postId),
  };
}

export async function fetchLikers(
  supabase: SupabaseClient,
  postId: string,
): Promise<(User & { reaction: ReactionType })[]> {
  const withReaction = await supabase
    .from("post_likes")
    .select(
      `
      created_at,
      reaction,
      user:profiles!user_id (
        id,
        name,
        username,
        avatar,
        bio,
        followers_count,
        following_count,
        posts_count
      )
    `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (withReaction.error) {
    if (isMissingLikesTableError(withReaction.error.message)) {
      throw new Error(
        "Likes need database setup. Run supabase/migrate-likes-comments.sql in Supabase → SQL Editor.",
      );
    }

    if (!isMissingReactionColumnError(withReaction.error.message)) {
      throw withReaction.error;
    }

    const legacy = await supabase
      .from("post_likes")
      .select(
        `
        created_at,
        user:profiles!user_id (
          id,
          name,
          username,
          avatar,
          bio,
          followers_count,
          following_count,
          posts_count
        )
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (legacy.error) throw legacy.error;

    const legacyLikers: (User & { reaction: ReactionType })[] = [];
    for (const row of legacy.data ?? []) {
      const user = Array.isArray(row.user) ? row.user[0] : row.user;
      if (!user) continue;
      legacyLikers.push({
        ...profileToUser(user as ProfileRow),
        reaction: "like",
      });
    }
    return legacyLikers;
  }

  const likers: (User & { reaction: ReactionType })[] = [];
  for (const row of withReaction.data ?? []) {
    const user = Array.isArray(row.user) ? row.user[0] : row.user;
    if (!user) continue;
    likers.push({
      ...profileToUser(user as ProfileRow),
      reaction: normalizeReaction(row.reaction),
    });
  }
  return likers;
}
