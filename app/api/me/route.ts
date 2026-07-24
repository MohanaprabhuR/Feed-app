import { fetchProfileById, profileToUser, type ProfileRow } from "@/lib/profile";
import { ApiError, handle, requireUser } from "@/lib/api";

/** GET /api/me — the signed-in user's profile. */
export async function GET() {
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const profile = await fetchProfileById(supabase, userId);
    if (!profile) throw new ApiError("Profile not found.", 404);
    return { user: profile };
  });
}

/**
 * PATCH /api/me — update the signed-in user's profile fields.
 * Body: { name?, email?, phone?, bio?, address?, city?, state?, zipCode?, avatar? }
 */
export async function PATCH(request: Request) {
  return handle(async () => {
    const { supabase, userId } = await requireUser();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new ApiError("Invalid request body.");
    }

    const updates: Record<string, string | null> = {};
    if (body.name !== undefined) {
      const name = String(body.name ?? "").trim();
      if (name.length < 2) {
        throw new ApiError("Name must be at least 2 characters.");
      }
      updates.name = name;
    }
    if (body.email !== undefined) {
      updates.email = body.email ? String(body.email).trim() : null;
    }
    if (body.phone !== undefined) {
      updates.phone = body.phone ? String(body.phone).trim() : null;
    }
    if (body.bio !== undefined) {
      updates.bio = body.bio ? String(body.bio).trim() : null;
    }
    if (body.address !== undefined) {
      updates.address = body.address ? String(body.address).trim() : null;
    }
    if (body.city !== undefined) {
      updates.city = body.city ? String(body.city).trim() : null;
    }
    if (body.state !== undefined) {
      updates.state = body.state ? String(body.state).trim() : null;
    }
    if (body.zipCode !== undefined) {
      updates.zip_code = body.zipCode ? String(body.zipCode).trim() : null;
    }
    if (body.avatar !== undefined) {
      updates.avatar = body.avatar ? String(body.avatar).trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError("No profile fields to update.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      const lower = error.message.toLowerCase();
      if (
        lower.includes("phone") ||
        lower.includes("address") ||
        lower.includes("zip_code") ||
        lower.includes("city") ||
        lower.includes("state")
      ) {
        throw new ApiError(
          "Contact fields need database setup. Run supabase/migrate-profile-contact.sql in Supabase → SQL Editor.",
        );
      }
      throw error;
    }

    return { user: profileToUser(data as ProfileRow) };
  });
}
