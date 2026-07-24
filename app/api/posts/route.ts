import { NextResponse } from "next/server";
import { fetchPosts } from "@/lib/posts";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Public feed: returns posts from ALL authors.
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
