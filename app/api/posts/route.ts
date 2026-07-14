import { NextResponse } from "next/server";
import { fetchPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

/**
 * Public feed: returns posts from ALL authors.
 * Uses service-role reader when configured so misconfigured RLS
 * cannot hide other users' posts.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const posts = await fetchPosts(supabase, { userId: user?.id ?? null });

    return NextResponse.json({ posts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load posts.";
    return NextResponse.json({ error: message, posts: [] }, { status: 500 });
  }
}
