import { deletePost, fetchPostById, updatePost } from "@/lib/posts";
import { ApiError, getClient, handle, requireUser } from "@/lib/api";
import type { PostEvent } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseImages(value: unknown): string[] | null {
  if (value === null) return null;
  if (!Array.isArray(value)) return null;
  return value
    .map((item) => optionalString(item))
    .filter((url): url is string => Boolean(url));
}

function parseMedia(
  value: unknown,
): { image?: string; video?: string; file?: string } | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("Invalid media payload.");
  }
  const raw = value as Record<string, unknown>;
  const image = optionalString(raw.image);
  const video = optionalString(raw.video);
  const file = optionalString(raw.file);
  if (!image && !video && !file) return null;
  return { image, video, file };
}

function parseEvent(value: unknown): PostEvent | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("Invalid event payload.");
  }
  const raw = value as Record<string, unknown>;
  const title = optionalString(raw.title);
  const startsAt = optionalString(raw.startsAt) ?? optionalString(raw.starts_at);
  if (!title || !startsAt) {
    throw new ApiError("Event needs a title and start date/time.");
  }
  const endsAt = optionalString(raw.endsAt) ?? optionalString(raw.ends_at);
  const location = optionalString(raw.location);
  return {
    title,
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    ...(location ? { location } : {}),
  };
}

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
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Invalid request body.");
    }

    const post = await updatePost(
      supabase,
      id,
      userId,
      String(body.content ?? ""),
      "media" in body ? parseMedia(body.media) : undefined,
      {
        ...(body.title !== undefined ? { title: String(body.title) } : {}),
        ...("event" in body ? { event: parseEvent(body.event) } : {}),
        ...("images" in body ? { images: parseImages(body.images) } : {}),
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
