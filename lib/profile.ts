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

export async function searchProfiles(
  supabase: SupabaseClient,
  query: string,
  options: { excludeUserId?: string; limit?: number } = {}
): Promise<User[]> {
  const { excludeUserId, limit = 20 } = options;
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`name.ilike.%${trimmed}%,username.ilike.%${trimmed}%`)
    .order("name", { ascending: true })
    .limit(limit + (excludeUserId ? 1 : 0));

  if (error || !data) return [];

  return data
    .filter((row) => row.id !== excludeUserId)
    .slice(0, limit)
    .map(profileToUser);
}
