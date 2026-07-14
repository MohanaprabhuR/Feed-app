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

export async function fetchFollowing(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number } = {},
): Promise<User[]> {
  const { limit = 50 } = options;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("follows")
    .select(
      `
      created_at,
      following:profiles!following_id (
        id,
        name,
        username,
        avatar,
        bio,
        followers_count,
        following_count,
        posts_count
      )
    `,
    )
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingFollowsTableError(error.message)) return [];
    throw error;
  }

  const users: User[] = [];
  for (const row of data ?? []) {
    const profile = Array.isArray(row.following)
      ? row.following[0]
      : row.following;
    if (!profile) continue;
    users.push({
      ...profileToUser(profile as ProfileRow),
      isFollowing: true,
    });
  }
  return users;
}

export async function fetchFollowers(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number; viewerId?: string } = {},
): Promise<User[]> {
  const { limit = 50, viewerId } = options;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("follows")
    .select(
      `
      created_at,
      follower:profiles!follower_id (
        id,
        name,
        username,
        avatar,
        bio,
        followers_count,
        following_count,
        posts_count
      )
    `,
    )
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingFollowsTableError(error.message)) return [];
    throw error;
  }

  let viewerFollowing = new Set<string>();
  if (viewerId) {
    viewerFollowing = await fetchFollowingIds(supabase, viewerId);
  }

  const users: User[] = [];
  for (const row of data ?? []) {
    const profile = Array.isArray(row.follower)
      ? row.follower[0]
      : row.follower;
    if (!profile) continue;
    const mapped = profileToUser(profile as ProfileRow);
    users.push({
      ...mapped,
      isFollowing: viewerId
        ? viewerId === mapped.id
          ? undefined
          : viewerFollowing.has(mapped.id)
        : false,
    });
  }
  return users;
}
