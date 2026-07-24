import { sharePostWithUsers } from "@/lib/shares";
import { ApiError, handle, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/posts/:id/share — share a post with one or more users.
 * Body: { recipientIds: string[] }
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    const recipientIds = body?.recipientIds;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw new ApiError("Select at least one person to share with.");
    }

    const ids = recipientIds
      .map((value: unknown) => String(value ?? "").trim())
      .filter(Boolean);

    return sharePostWithUsers(supabase, id, userId, ids);
  });
}
