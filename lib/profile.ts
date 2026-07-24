import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultAvatar } from "@/lib/auth";
import type { User } from "@/lib/types";

export type ProfileRow = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  bio?: string | null;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
};

export function profileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email || undefined,
    avatar: row.avatar || getDefaultAvatar(row.username),
    bio: row.bio || "",
    phone: row.phone || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    zipCode: row.zip_code || undefined,
    followers: row.followers_count ?? 0,
    following: row.following_count ?? 0,
    posts: row.posts_count ?? 0,
  };
}

export async function fetchProfileById(
  supabase: SupabaseClient,
  id: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return profileToUser(data);
}

export async function fetchSuggestedProfiles(
  supabase: SupabaseClient,
  options: { excludeUserId?: string; limit?: number } = {},
): Promise<User[]> {
  const { excludeUserId, limit = 3 } = options;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 4, 12));

  if (error || !data) return [];

  let followingIds = new Set<string>();
  if (excludeUserId) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", excludeUserId);
    followingIds = new Set(
      (follows ?? []).map((row) => row.following_id as string),
    );
  }

  return data
    .filter(
      (row) => row.id !== excludeUserId && !followingIds.has(row.id as string),
    )
    .slice(0, limit)
    .map((row) => ({
      ...profileToUser(row),
      isFollowing: false,
    }));
}

async function withFollowState(
  supabase: SupabaseClient,
  users: User[],
  viewerId?: string,
): Promise<User[]> {
  if (!viewerId || users.length === 0) {
    return users.map((user) => ({ ...user, isFollowing: false }));
  }

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)
    .in(
      "following_id",
      users.map((user) => user.id),
    );

  const followingIds = new Set(
    (follows ?? []).map((row) => row.following_id as string),
  );

  return users.map((user) => ({
    ...user,
    isFollowing: followingIds.has(user.id),
  }));
}

/** Registered profiles for search browse (empty query) or name/username match. */
export async function searchProfiles(
  supabase: SupabaseClient,
  query: string,
  options: { excludeUserId?: string; limit?: number } = {},
): Promise<User[]> {
  const { excludeUserId, limit = 20 } = options;
  const trimmed = query.trim();
  // Strip PostgREST filter metacharacters so user input can't reshape .or().
  const safeTerm = trimmed.replace(/[%_,.()\\]/g, " ").replace(/\s+/g, " ").trim();

  let request = supabase.from("profiles").select("*");

  if (safeTerm) {
    request = request.or(
      `name.ilike.%${safeTerm}%,username.ilike.%${safeTerm}%`,
    );
  }

  const { data, error } = await request
    .order(safeTerm ? "name" : "created_at", {
      ascending: Boolean(safeTerm),
    })
    .limit(limit + (excludeUserId ? 1 : 0));

  if (error || !data) return [];

  const users = data
    .filter((row) => row.id !== excludeUserId)
    .slice(0, limit)
    .map(profileToUser);

  return withFollowState(supabase, users, excludeUserId);
}
