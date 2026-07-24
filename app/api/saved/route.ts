import { fetchSavedPosts } from "@/lib/saves";
import { handle, requireUser } from "@/lib/api";

/** GET /api/saved — the signed-in user's saved posts. */
export async function GET() {
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const posts = await fetchSavedPosts(supabase, userId);
    return { posts };
  });
}
