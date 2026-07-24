import { NextResponse } from "next/server";
import { createArticle, createPost, fetchPosts } from "@/lib/posts";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ApiError, handle, requireUser } from "@/lib/api";

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
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new ApiError("Invalid request body.");
    }

    if (body.type === "article") {
      const post = await createArticle(supabase, userId, {
        title: String(body.title ?? ""),
        content: String(body.content ?? ""),
        coverImage: body.coverImage ? String(body.coverImage) : undefined,
      });
      return { post };
    }

    const post = await createPost(
      supabase,
      userId,
      String(body.content ?? ""),
      body.media,
      body.event,
      body.celebration,
    );
    return { post };
  });
}
