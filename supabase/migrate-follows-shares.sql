-- Follows + post shares
-- Safe to re-run.

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_follower_id_idx on public.follows (follower_id);
create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

create or replace function public.handle_follow_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set following_count = following_count + 1
  where id = new.follower_id;

  update public.profiles
  set followers_count = followers_count + 1
  where id = new.following_id;

  return new;
end;
$$;

create or replace function public.handle_follow_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set following_count = greatest(following_count - 1, 0)
  where id = old.follower_id;

  update public.profiles
  set followers_count = greatest(followers_count - 1, 0)
  where id = old.following_id;

  return old;
end;
$$;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.handle_follow_insert();

drop trigger if exists on_follow_deleted on public.follows;
create trigger on_follow_deleted
  after delete on public.follows
  for each row execute function public.handle_follow_delete();

create table if not exists public.post_shares (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (post_id, sender_id, recipient_id),
  check (sender_id <> recipient_id)
);

create index if not exists post_shares_post_id_idx on public.post_shares (post_id);
create index if not exists post_shares_sender_id_idx on public.post_shares (sender_id);
create index if not exists post_shares_recipient_id_idx on public.post_shares (recipient_id);

alter table public.post_shares enable row level security;

drop policy if exists "Post shares are viewable by participants" on public.post_shares;
create policy "Post shares are viewable by participants"
  on public.post_shares for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can share posts" on public.post_shares;
create policy "Users can share posts"
  on public.post_shares for insert
  with check (auth.uid() = sender_id);

create or replace function public.handle_post_share_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set shares_count = shares_count + 1
  where id = new.post_id;
  return new;
end;
$$;

drop trigger if exists on_post_share_created on public.post_shares;
create trigger on_post_share_created
  after insert on public.post_shares
  for each row execute function public.handle_post_share_insert();

alter table public.follows replica identity full;
alter table public.post_shares replica identity full;
