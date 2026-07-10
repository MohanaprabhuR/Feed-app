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
  return { ...row, author };
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

export function postRowToPost(row: PostRow): Post | null {
  const normalized = normalizePostRow(row);
  if (!normalized?.id) return null;

  const postType = normalized.post_type ?? "post";
  const author = normalized.author ?? getFallbackAuthor();

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
      isLiked: false,
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
    isLiked: false,
    isSaved: false,
  };
}

export async function fetchPosts(supabase: SupabaseClient) {
  const rows = await queryPosts(supabase, (select) =>
    supabase.from("posts").select(select).order("created_at", { ascending: false })
  );

  return rows
    .map((row) => postRowToPost(row))
    .filter((post): post is Post => post !== null);
}

export async function fetchPostById(supabase: SupabaseClient, id: string) {
  const rows = await queryPosts(supabase, (select) =>
    supabase.from("posts").select(select).eq("id", id).maybeSingle()
  );

  const row = rows[0];
  if (!row) return null;
  return postRowToPost(row);
}

export async function fetchPostsByAuthor(
  supabase: SupabaseClient,
  authorId: string
) {
  const rows = await queryPosts(supabase, (select) =>
    supabase
      .from("posts")
      .select(select)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
  );

  return rows
    .map((row) => postRowToPost(row))
    .filter((post): post is Post => post !== null);
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
