-- Fix feed so EVERY user’s posts are readable (not only your own).
-- Run in Supabase → SQL Editor. Safe to re-run.

-- Table privileges (required in addition to RLS)
grant usage on schema public to anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant select on table public.profiles to anon, authenticated;

alter table public.posts enable row level security;
alter table public.profiles enable row level security;

-- Drop common restrictive / duplicate SELECT policies
drop policy if exists "Posts are viewable by everyone" on public.posts;
drop policy if exists "Users can view their own posts" on public.posts;
drop policy if exists "Users can view posts" on public.posts;
drop policy if exists "Enable read access for all users" on public.posts;
drop policy if exists "Public posts are viewable by everyone" on public.posts;
drop policy if exists "posts_select_own" on public.posts;
drop policy if exists "posts_select_policy" on public.posts;

-- Anyone (signed in or anonymous) can read all posts
create policy "Posts are viewable by everyone"
  on public.posts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  to anon, authenticated
  using (true);
