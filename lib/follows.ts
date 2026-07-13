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

export async function fetchFollowing(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number } = {}
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
    `
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
