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
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
};

export function profileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatar: row.avatar || getDefaultAvatar(row.username),
    bio: row.bio || "",
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
