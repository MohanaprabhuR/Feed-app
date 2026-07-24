import { deletePost, fetchPostById, updatePost } from "@/lib/posts";
import { ApiError, getClient, handle, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/posts/:id — single post with the viewer's like/save state. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await getClient();
    const post = await fetchPostById(supabase, id, { userId });
    if (!post) throw new ApiError("Post not found.", 404);
    return { post };
  });
}

/**
 * PATCH /api/posts/:id — update your own post.
 * Body: { content, media?, title?, event? }
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new ApiError("Invalid request body.");
    }

    const post = await updatePost(
      supabase,
      id,
      userId,
      String(body.content ?? ""),
      body.media,
      {
        ...(body.title !== undefined ? { title: String(body.title) } : {}),
        ...(body.event !== undefined ? { event: body.event } : {}),
      },
    );
    return { post };
  });
}

/** DELETE /api/posts/:id — delete your own post. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    await deletePost(supabase, id, userId);
    return { success: true };
  });
}
