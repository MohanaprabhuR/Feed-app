import { createComment, fetchComments } from "@/lib/comments";
import { fetchProfileById } from "@/lib/profile";
import { ApiError, getClient, handle, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/posts/:id/comments — threaded comments for a post. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await getClient();
    const comments = await fetchComments(supabase, id, { userId });
    return { comments };
  });
}

/**
 * POST /api/posts/:id/comments — add a comment (or reply) as the signed-in user.
 * Body: { content, parentId? }
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new ApiError("Invalid request body.");
    }

    const author = await fetchProfileById(supabase, userId);
    if (!author) throw new ApiError("Profile not found.", 404);

    const comment = await createComment(
      supabase,
      id,
      author,
      String(body.content ?? ""),
      body.parentId ? String(body.parentId) : undefined,
    );
    return { comment };
  });
}
