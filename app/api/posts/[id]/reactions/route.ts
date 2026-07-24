import {
  clearReaction,
  fetchLikers,
  REACTIONS,
  setReaction,
} from "@/lib/likes";
import { ApiError, getClient, handle, requireUser } from "@/lib/api";
import type { ReactionType } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_REACTIONS = new Set<string>(REACTIONS.map((r) => r.type));

/** GET /api/posts/:id/reactions — who reacted, with their reaction type. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase } = await getClient();
    const reactors = await fetchLikers(supabase, id);
    return { reactors };
  });
}

/**
 * PUT /api/posts/:id/reactions — set (or change) your reaction.
 * Body: { reaction: "like" | "celebrate" | "support" | "love" | "insightful" | "funny" }
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

    const result = await setReaction(
      supabase,
      id,
      userId,
      reaction as ReactionType,
    );
    return result;
  });
}

/** DELETE /api/posts/:id/reactions — remove your reaction. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const result = await clearReaction(supabase, id, userId);
    return result;
  });
}
