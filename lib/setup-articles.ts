import type { SupabaseClient } from "@supabase/supabase-js";

export const ARTICLES_MIGRATION_SQL = `-- Run in Supabase → SQL Editor
alter table public.posts
  add column if not exists post_type text default 'post' not null;

alter table public.posts
  add column if not exists title text;

alter table public.posts
  drop constraint if exists posts_post_type_check;

alter table public.posts
  add constraint posts_post_type_check
  check (post_type in ('post', 'article'));
`;

export async function articlesColumnsExist(supabase: SupabaseClient) {
  const { error } = await supabase.from("posts").select("post_type, title").limit(1);
  if (!error) return true;
  return !(
    error.message.includes("post_type") ||
    error.message.includes("title") ||
    error.message.includes("schema cache")
  );
}
