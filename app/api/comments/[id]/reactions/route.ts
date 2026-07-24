import { setCommentReaction, toggleCommentLike } from "@/lib/comments";
import { REACTIONS } from "@/lib/likes";
import { ApiError, handle, requireUser } from "@/lib/api";
import type { ReactionType } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_REACTIONS = new Set<string>(REACTIONS.map((r) => r.type));

/**
 * PUT /api/comments/:id/reactions — set (or change) your comment reaction.
 * Body: { reaction: ReactionType }
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    const reaction = body?.reaction;

    if (typeof reaction !== "string" || !VALID_REACTIONS.has(reaction)) {
      throw new ApiError("Invalid reaction type.");
    }

    return setCommentReaction(
      supabase,
      id,
      userId,
      reaction as ReactionType,
    );
  });
}

/** DELETE /api/comments/:id/reactions — clear / toggle off your comment reaction. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    return toggleCommentLike(supabase, id, userId);
  });
}
