import type { SupabaseClient } from "@supabase/supabase-js";
import { postRowToPost, resolveSchemaMode, type PostRow } from "@/lib/posts";
import type { ProfileRow } from "@/lib/profile";
import type { Post } from "@/lib/types";

function isMissingSavesTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("post_saves") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

function missingSavesSetupError() {
  return new Error(
    "Saved posts need database setup. Run supabase/migrate-saved-posts.sql in Supabase → SQL Editor.",
  );
}

function fallbackAuthor(authorId?: string): ProfileRow {
  return {
    id: authorId ?? "unknown",
    name: "User",
    username: "user",
    avatar: null,
    bio: "",
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
  };
}

export async function fetchSavedPostIds(
  supabase: SupabaseClient,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("post_saves")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) {
    if (isMissingSavesTableError(error.message)) return new Set();
    throw error;
  }

  return new Set((data ?? []).map((row) => row.post_id as string));
}

export async function savePost(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
) {
  const { error } = await supabase.from("post_saves").upsert(
    { user_id: userId, post_id: postId },
    { onConflict: "user_id,post_id", ignoreDuplicates: true },
  );

  if (error) {
    if (isMissingSavesTableError(error.message)) throw missingSavesSetupError();
    throw error;
  }
}

export async function unsavePost(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
) {
  const { error } = await supabase
    .from("post_saves")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (error) {
    if (isMissingSavesTableError(error.message)) throw missingSavesSetupError();
    throw error;
  }
}

export async function toggleSavePost(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  currentlySaved: boolean,
): Promise<boolean> {
  if (currentlySaved) {
    await unsavePost(supabase, userId, postId);
    return false;
  }
  await savePost(supabase, userId, postId);
  return true;
}

export async function fetchSavedPosts(
  supabase: SupabaseClient,
  userId: string,
): Promise<Post[]> {
  const { data: saves, error: savesError } = await supabase
    .from("post_saves")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (savesError) {
    if (isMissingSavesTableError(savesError.message)) {
      throw missingSavesSetupError();
    }
    throw savesError;
  }

  const postIds = (saves ?? []).map((row) => row.post_id as string);
  if (postIds.length === 0) return [];

  const mode = await resolveSchemaMode(supabase);
  const result =
    mode === "modern"
      ? await supabase
          .from("posts")
          .select(
            "id, content, image, post_type, title, likes_count, comments_count, shares_count, created_at, author_id",
          )
          .in("id", postIds)
      : await supabase
          .from("posts")
          .select(
            "id, content, image, likes_count, comments_count, shares_count, created_at, author_id",
          )
          .in("id", postIds);

  if (result.error) throw result.error;

  const rows = (result.data as unknown as PostRow[] | null) ?? [];
  const authorIds = [
    ...new Set(
      rows
        .map((row) => row.author_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let authorsById = new Map<string, ProfileRow>();
  if (authorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, name, username, avatar, bio, followers_count, following_count, posts_count",
      )
      .in("id", authorIds);

    if (!profileError && profiles) {
      authorsById = new Map(
        profiles.map((profile) => [profile.id as string, profile as ProfileRow]),
      );
    }
  }

  const postsById = new Map<string, Post>();
  for (const row of rows) {
    const post = postRowToPost({
      ...row,
      post_type: row.post_type ?? "post",
      title: row.title ?? null,
      author: row.author_id
        ? (authorsById.get(row.author_id) ?? fallbackAuthor(row.author_id))
        : fallbackAuthor(),
    });
    if (post) {
      postsById.set(post.id, { ...post, isSaved: true });
    }
  }

  return postIds
    .map((id) => postsById.get(id))
    .filter((post): post is Post => Boolean(post));
}
