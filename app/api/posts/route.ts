import { NextResponse } from "next/server";
import { createArticle, createPost, fetchPosts } from "@/lib/posts";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ApiError, handle, requireUser } from "@/lib/api";
import type { PostCelebration, PostEvent } from "@/lib/types";

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseMedia(value: unknown):
  | { image?: string; video?: string; file?: string }
  | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const image = optionalString(raw.image);
  const video = optionalString(raw.video);
  const file = optionalString(raw.file);
  if (!image && !video && !file) return undefined;
  return { image, video, file };
}

function parseEvent(value: unknown): PostEvent | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const title = optionalString(raw.title);
  const startsAt = optionalString(raw.startsAt) ?? optionalString(raw.starts_at);
  if (!title || !startsAt) return undefined;

  const endsAt = optionalString(raw.endsAt) ?? optionalString(raw.ends_at);
  const location = optionalString(raw.location);

  return {
    title,
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    ...(location ? { location } : {}),
  };
}

function parseImages(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const urls = value
    .map((item) => optionalString(item))
    .filter((url): url is string => Boolean(url));
  return urls.length ? urls : undefined;
}

function parseCelebration(value: unknown): PostCelebration | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const occasion = optionalString(raw.occasion);
  if (!occasion) return undefined;
  const message = optionalString(raw.message);
  return {
    occasion: occasion as PostCelebration["occasion"],
    ...(message ? { message } : {}),
  };
}

/**
 * GET /api/posts — public feed: posts from ALL authors.
 *
 * Auth client (cookie session) → identity + per-user like/save state.
 * Admin reader (service role, when set) → bypasses RLS so the feed
 * always includes every author's posts even if SELECT policies are wrong.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const posts = await fetchPosts(supabase, {
      userId: user?.id ?? null,
      reader: getAdminClient() ?? undefined,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load posts.";
    return NextResponse.json({ error: message, posts: [] }, { status: 500 });
  }
}

/**
 * POST /api/posts — create a post or article as the signed-in user.
 *
 * Body (post):    { content, media?, event?, celebration? }
 * Body (article): { type: "article", title, content, coverImage? }
 *
 * Stored in `posts`:
 *   author_id = session user id
 *   content, image (media URL), post_type, title?, event?, celebration?
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Invalid request body.");
    }

    if (body.type === "article") {
      const post = await createArticle(supabase, userId, {
        title: String(body.title ?? ""),
        content: String(body.content ?? ""),
        coverImage: optionalString(body.coverImage),
      });
      return { post };
    }

    const post = await createPost(
      supabase,
      userId,
      String(body.content ?? ""),
      parseMedia(body.media),
      parseEvent(body.event),
      parseCelebration(body.celebration),
      parseImages(body.images),
      body.mediaLayout === "slider"
        ? "slider"
        : body.mediaLayout === "document"
          ? "document"
          : "grid",
      Array.isArray(body.imageCaptions)
        ? body.imageCaptions.map((c: unknown) => (typeof c === "string" ? c : ""))
        : undefined,
      typeof body.title === "string" ? body.title : undefined,
    );
    return { post };
  });
}
