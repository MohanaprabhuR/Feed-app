import type { SupabaseClient } from "@supabase/supabase-js";
import { profileToUser, type ProfileRow } from "@/lib/profile";
import type { User } from "@/lib/types";

function isMissingFollowsTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("follows") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export function missingFollowsSetupError() {
  return new Error(
    "Follows need database setup. Run supabase/migrate-follows-shares.sql in Supabase → SQL Editor.",
  );
}

export async function fetchFollowingIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) {
    if (isMissingFollowsTableError(error.message)) return new Set();
    throw error;
  }

  return new Set((data ?? []).map((row) => row.following_id as string));
}

export async function isFollowingUser(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    if (isMissingFollowsTableError(error.message)) return false;
    throw error;
  }

  return Boolean(data);
}

export async function toggleFollow(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string,
  currentlyFollowing: boolean,
): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) {
    throw new Error("Invalid follow target.");
  }

  if (currentlyFollowing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      if (isMissingFollowsTableError(error.message)) {
        throw missingFollowsSetupError();
      }
      throw error;
    }
    return false;
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error) {
    if (isMissingFollowsTableError(error.message)) {
      throw missingFollowsSetupError();
    }
    throw error;
  }

  return true;
}

const PROFILE_COLUMNS =
  "id, name, username, avatar, bio, followers_count, following_count, posts_count";

async function fetchProfilesInOrder(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, User>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", ids);

  if (error) throw error;

  const users = new Map<string, User>();
  for (const row of data ?? []) {
    users.set(row.id as string, profileToUser(row as ProfileRow));
  }
  return users;
}

/** People `userId` follows — not the full user directory. */
export async function fetchFollowing(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number } = {},
): Promise<User[]> {
  const { limit = 50 } = options;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingFollowsTableError(error.message)) return [];
    throw error;
  }

  const ids = (data ?? [])
    .map((row) => row.following_id as string)
    .filter((id) => id && id !== userId);

  const profiles = await fetchProfilesInOrder(supabase, ids);
  return ids.flatMap((id) => {
    const profile = profiles.get(id);
    return profile ? [{ ...profile, isFollowing: true }] : [];
  });
}

/** People who follow `userId` — not the full user directory. */
export async function fetchFollowers(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number; viewerId?: string } = {},
): Promise<User[]> {
  const { limit = 50, viewerId } = options;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingFollowsTableError(error.message)) return [];
    throw error;
  }

  const ids = (data ?? [])
    .map((row) => row.follower_id as string)
    .filter((id) => id && id !== userId);

  const profiles = await fetchProfilesInOrder(supabase, ids);

  let viewerFollowing = new Set<string>();
  if (viewerId) {
    viewerFollowing = await fetchFollowingIds(supabase, viewerId);
  }

  return ids.flatMap((id) => {
    const profile = profiles.get(id);
    if (!profile) return [];
    return [
      {
        ...profile,
        isFollowing: viewerId
          ? viewerId === profile.id
            ? undefined
            : viewerFollowing.has(profile.id)
          : false,
      },
    ];
  });
}

/** Users the viewer follows, filtered for @mention suggestions. */
export async function searchFollowingForMentions(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  options: { limit?: number } = {},
): Promise<User[]> {
  const { limit = 8 } = options;
  if (!userId) return [];

  const following = await fetchFollowing(supabase, userId, { limit: 100 });
  const trimmed = query.trim().toLowerCase().replace(/^@+/, "");

  if (!trimmed) {
    return following.slice(0, limit);
  }

  return following
    .filter((user) => {
      const name = user.name.toLowerCase();
      const username = user.username.toLowerCase();
      return name.includes(trimmed) || username.includes(trimmed);
    })
    .slice(0, limit);
}
