import { savePost, unsavePost } from "@/lib/saves";
import { handle, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/posts/:id/save — bookmark the post. */
export async function PUT(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    await savePost(supabase, userId, id);
    return { saved: true };
  });
}

/** DELETE /api/posts/:id/save — remove the bookmark. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    await unsavePost(supabase, userId, id);
    return { saved: false };
  });
}
