import type { SupabaseClient } from "@supabase/supabase-js";
import { splitPostMedia } from "@/lib/errors";
import { profileToUser, type ProfileRow } from "@/lib/profile";
import type { Post, PostType } from "@/lib/types";

export type PostRow = {
  id: string;
  content: string;
  image: string | null;
  video?: string | null;
  post_type?: PostType | null;
  title?: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_id?: string | null;
  author: ProfileRow | ProfileRow[] | null;
};

type SchemaMode = "legacy" | "modern";

let cachedSchemaMode: SchemaMode | null = null;

const postSelect = `
  id,
  content,
  image,
  post_type,
  title,
  likes_count,
  comments_count,
  shares_count,
  created_at,
  author_id,
  author:profiles!author_id (
    id,
    name,
    username,
    avatar,
    bio,
    followers_count,
    following_count,
    posts_count
  )
`;

const legacyPostSelect = `
  id,
  content,
  image,
  likes_count,
  comments_count,
  shares_count,
  created_at,
  author_id,
  author:profiles!author_id (
    id,
    name,
    username,
    avatar,
    bio,
    followers_count,
    following_count,
    posts_count
  )
`;

function normalizePostRow(row: PostRow) {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    ...row,
    author: author ?? (row.author_id ? getFallbackAuthor(row.author_id) : null),
  };
}

function getFallbackAuthor(authorId?: string): ProfileRow {
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

function isMissingArticleColumnsError(message: string) {
  return (
    message.includes("post_type") ||
    message.includes("title") ||
    message.includes("schema cache")
  );
}

function normalizeRows(data: PostRow | PostRow[] | null | undefined): PostRow[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function withLegacyDefaults(row: PostRow): PostRow {
  return {
    ...row,
    post_type: row.post_type ?? "post",
    title: row.title ?? null,
  };
}

export async function resolveSchemaMode(
  supabase: SupabaseClient
): Promise<SchemaMode> {
  if (cachedSchemaMode) return cachedSchemaMode;

  const { error } = await supabase.from("posts").select("post_type").limit(1);
  cachedSchemaMode =
    error && isMissingArticleColumnsError(error.message) ? "legacy" : "modern";
  return cachedSchemaMode;
}

export function resetSchemaModeCache() {
  cachedSchemaMode = null;
}

function activeSelect(mode: SchemaMode) {
  return mode === "modern" ? postSelect : legacyPostSelect;
}

async function queryPosts(
  supabase: SupabaseClient,
  buildQuery: (select: string) => PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>
) {
  const mode = await resolveSchemaMode(supabase);
  const result = await buildQuery(activeSelect(mode));
  if (result.error) throw result.error;

  return normalizeRows(result.data as PostRow | PostRow[] | null).map(
    withLegacyDefaults
  );
}

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
}

export function postRowToPost(
  row: PostRow,
  options: { likedPostIds?: Set<string> } = {}
): Post | null {
  const normalized = normalizePostRow(row);
  if (!normalized?.id) return null;

  const postType = normalized.post_type ?? "post";
  const author = normalized.author ?? getFallbackAuthor();
  const isLiked = options.likedPostIds?.has(normalized.id) ?? false;

  if (postType === "article") {
    return {
      id: normalized.id,
      author: profileToUser(author),
      type: "article",
      title: normalized.title ?? undefined,
      content: normalized.content,
      image: normalized.image ?? undefined,
      likes: normalized.likes_count ?? 0,
      comments: normalized.comments_count ?? 0,
      shares: normalized.shares_count ?? 0,
      createdAt: formatRelativeTime(normalized.created_at),
      isLiked,
      isSaved: false,
    };
  }

  const media = splitPostMedia(normalized.image, normalized.video);

  return {
    id: normalized.id,
    author: profileToUser(author),
    type: "post",
    content: normalized.content,
    image: media.image,
    video: media.video,
    file: media.file,
    likes: normalized.likes_count ?? 0,
    comments: normalized.comments_count ?? 0,
    shares: normalized.shares_count ?? 0,
    createdAt: formatRelativeTime(normalized.created_at),
    isLiked,
    isSaved: false,
  };
}

async function withLikedState(
  supabase: SupabaseClient,
  posts: Post[],
  userId?: string | null
) {
  if (posts.length === 0) return posts;

  const { fetchReactionSummaries, fetchUserReactions } = await import(
    "@/lib/likes"
  );
  const { fetchSavedPostIds } = await import("@/lib/saves");
  const postIds = posts.map((post) => post.id);

  const [summaries, reactions, savedIds] = await Promise.all([
    fetchReactionSummaries(supabase, postIds),
    userId
      ? fetchUserReactions(supabase, userId, postIds)
      : Promise.resolve(new Map()),
    userId
      ? fetchSavedPostIds(supabase, userId, postIds)
      : Promise.resolve(new Set<string>()),
  ]);

  return posts.map((post) => {
    const reaction = reactions.get(post.id) ?? null;
    return {
      ...post,
      isLiked: reaction !== null,
      reaction,
      reactionSummary: summaries.get(post.id) ?? [],
      isSaved: savedIds.has(post.id),
    };
  });
}

async function loadAllPostRows(reader: SupabaseClient) {
  // Prefer admin reader when available so a misconfigured RLS can't hide
  // other users' posts from the shared feed.
  const mode = await resolveSchemaMode(reader);

  const result =
    mode === "modern"
      ? await reader
          .from("posts")
          .select(
            "id, content, image, post_type, title, likes_count, comments_count, shares_count, created_at, author_id",
          )
          .order("created_at", { ascending: false })
      : await reader
          .from("posts")
          .select(
            "id, content, image, likes_count, comments_count, shares_count, created_at, author_id",
          )
          .order("created_at", { ascending: false });

  if (result.error) throw result.error;

  return normalizeRows(
    (result.data as unknown as PostRow[] | null) ?? null,
  ).map(withLegacyDefaults);
}

async function loadAuthorsById(
  reader: SupabaseClient,
  authorIds: string[],
): Promise<Map<string, ProfileRow>> {
  if (authorIds.length === 0) return new Map();

  const { data: profiles, error: profileError } = await reader
    .from("profiles")
    .select(
      "id, name, username, avatar, bio, followers_count, following_count, posts_count",
    )
    .in("id", authorIds);

  if (profileError || !profiles) return new Map();

  return new Map(
    profiles.map((profile) => [profile.id as string, profile as ProfileRow]),
  );
}

/**
 * Feed posts from every author. Never filters by the signed-in user.
 * `userId` is only used to attach like/saved state for the current viewer.
 */
export async function fetchPosts(
  supabase: SupabaseClient,
  options: { userId?: string | null; reader?: SupabaseClient } = {},
) {
  // Prefer service-role reader on the server so misconfigured RLS can't hide
  // other authors. Never use the admin client in the browser.
  let reader = options.reader ?? supabase;
  if (!options.reader && typeof window === "undefined") {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    reader = getAdminClient() ?? supabase;
  }

  const postRows = await loadAllPostRows(reader);
  const authorIds = [
    ...new Set(
      postRows
        .map((row) => row.author_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const authorsById = await loadAuthorsById(reader, authorIds);

  const posts = postRows
    .map((row) =>
      postRowToPost({
        ...row,
        author: row.author_id
          ? (authorsById.get(row.author_id) ?? getFallbackAuthor(row.author_id))
          : getFallbackAuthor(),
      }),
    )
    .filter((post): post is Post => post !== null);

  // Likes / saves still use the viewer client (RLS-aware for that user).
  return withLikedState(supabase, posts, options.userId);
}

export async function fetchPostById(
  supabase: SupabaseClient,
  id: string,
  options: { userId?: string | null } = {}
) {
  const rows = await queryPosts(supabase, (select) =>
    supabase.from("posts").select(select).eq("id", id).maybeSingle()
  );

  const row = rows[0];
  if (!row) return null;
  const post = postRowToPost(row);
  if (!post) return null;

  const [enriched] = await withLikedState(supabase, [post], options.userId);
  return enriched ?? post;
}

export async function fetchPostsByAuthor(
  supabase: SupabaseClient,
  authorId: string,
  options: { userId?: string | null } = {}
) {
  const rows = await queryPosts(supabase, (select) =>
    supabase
      .from("posts")
      .select(select)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
  );

  const posts = rows
    .map((row) => postRowToPost(row))
    .filter((post): post is Post => post !== null);

  return withLikedState(supabase, posts, options.userId);
}

export async function createPost(
  supabase: SupabaseClient,
  authorId: string,
  content: string,
  media?: { image?: string; video?: string; file?: string }
) {
  const trimmed = content.trim();
  if (!trimmed && !media?.image && !media?.video && !media?.file) {
    throw new Error("Post must include text or an attachment.");
  }

  const mediaUrl = media?.video ?? media?.image ?? media?.file ?? null;
  const mode = await resolveSchemaMode(supabase);

  const { data, error } =
    mode === "modern"
      ? await supabase
          .from("posts")
          .insert({
            author_id: authorId,
            content: trimmed,
            image: mediaUrl,
            post_type: "post",
          })
          .select(postSelect)
          .single()
      : await supabase
          .from("posts")
          .insert({
            author_id: authorId,
            content: trimmed,
            image: mediaUrl,
          })
          .select(legacyPostSelect)
          .single();

  if (error) throw error;
  return postRowToPost(withLegacyDefaults(data as PostRow))!;
}

export async function createArticle(
  supabase: SupabaseClient,
  authorId: string,
  input: { title: string; content: string; coverImage?: string }
) {
  const title = input.title.trim();
  const content = input.content.trim();

  if (!title) throw new Error("Article title is required.");
  if (!content) throw new Error("Article body is required.");

  const mode = await resolveSchemaMode(supabase);
  if (mode === "legacy") {
    throw new Error(
      "Articles need database setup. Run supabase/migrate-articles.sql in Supabase → SQL Editor (Dashboard → SQL → New query → paste → Run)."
    );
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: authorId,
      title,
      content,
      image: input.coverImage ?? null,
      post_type: "article",
    })
    .select(postSelect)
    .single();

  if (error) {
    if (isMissingArticleColumnsError(error.message)) {
      cachedSchemaMode = "legacy";
      throw new Error(
        "Articles need database setup. Run supabase/migrate-articles.sql in Supabase → SQL Editor."
      );
    }
    throw error;
  }

  return postRowToPost(data as PostRow)!;
}

export async function updatePost(
  supabase: SupabaseClient,
  postId: string,
  authorId: string,
  content: string,
  media?: { image?: string; video?: string; file?: string } | null,
) {
  const trimmed = content.trim();
  const replacingMedia = media !== undefined;
  const hasNewMedia = Boolean(media?.image || media?.video || media?.file);

  if (replacingMedia && !trimmed && !hasNewMedia) {
    throw new Error("Post must include text or an attachment.");
  }

  const mode = await resolveSchemaMode(supabase);
  const select = activeSelect(mode);

  const payload: { content: string; image?: string | null } = {
    content: trimmed,
  };

  if (media === null) {
    payload.image = null;
  } else if (media) {
    payload.image = media.video ?? media.image ?? media.file ?? null;
  }

  const { data, error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", postId)
    .eq("author_id", authorId)
    .select(select)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("You can only edit your own posts.");
  }

  return postRowToPost(withLegacyDefaults(data as unknown as PostRow))!;
}

export async function deletePost(
  supabase: SupabaseClient,
  postId: string,
  authorId: string,
) {
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", authorId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("You can only delete your own posts.");
  }
}
