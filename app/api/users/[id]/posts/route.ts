import { fetchPostsByAuthor } from "@/lib/posts";
import { getClient, handle } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/users/:id/posts — posts by a specific author. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await getClient();
    const posts = await fetchPostsByAuthor(supabase, id, { userId });
    return { posts };
  });
}
