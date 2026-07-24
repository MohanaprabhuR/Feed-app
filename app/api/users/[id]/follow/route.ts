import { toggleFollow } from "@/lib/follows";
import { ApiError, handle, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/users/:id/follow — follow a user. */
export async function PUT(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    if (id === userId) {
      throw new ApiError("You cannot follow yourself.");
    }
    await toggleFollow(supabase, userId, id, false);
    return { following: true as const };
  });
}

/** DELETE /api/users/:id/follow — unfollow a user. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    if (id === userId) {
      throw new ApiError("You cannot unfollow yourself.");
    }
    await toggleFollow(supabase, userId, id, true);
    return { following: false as const };
  });
}
