-- ============================================================================
-- FeedApp — consolidated Supabase schema
-- Run in the Supabase SQL Editor (Dashboard → SQL).
-- Safe to re-run: idempotent via IF NOT EXISTS / DROP IF EXISTS / OR REPLACE.
--
-- Contents
--   1.  Shared helpers & grants
--   2.  Profiles (identity, 1:1 with auth.users)
--   3.  Posts (posts / articles / events / celebrations)
--   4.  Post reactions (post_likes + atomic reaction RPCs)
--   5.  Comments (with one-level replies)
--   6.  Comment reactions (comment_likes)
--   7.  Follows (social graph)
--   8.  Post shares (send a post to a person)
--   9.  Saved posts (private bookmarks)
--   10. Direct messaging (1:1 conversations)
--   11. Notifications (likes, comments, messages, follows)
--   12. Realtime (replica identity + publications)
--   13. Storage (post-media bucket)
--
-- Conventions
--   - RLS on every table: public SELECT for social data, writes gated by
--     auth.uid() = <owner>. post_saves / post_shares / messaging are private.
--   - Counter columns (likes_count, followers_count, ...) are denormalized
--     and maintained by AFTER INSERT/DELETE triggers.
--   - Trigger functions are SECURITY DEFINER with search_path pinned to
--     public: they must bypass RLS to update other users' rows, and the
--     pinned search_path blocks privilege-escalation via schema shadowing.
-- ============================================================================


-- ============================================================================
-- 1. Shared helpers & grants
-- ============================================================================

-- Keep updated_at fresh on any row update (used by profiles and posts).
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Baseline read access (Supabase grants these by default; re-asserted here so
-- a project with stripped grants still serves the public feed).
grant usage on schema public to anon, authenticated;


-- ============================================================================
-- 2. Profiles
-- One row per auth.users entry (same id, cascade-deleted with the account).
-- ============================================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  username text unique not null,
  email text,
  bio text default '',
  avatar text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  followers_count integer default 0,
  following_count integer default 0,
  posts_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Late-added columns for databases created before they existed.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists zip_code text;

grant select on table public.profiles to anon, authenticated;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create a profile on signup, with a deterministic UI Faces avatar.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'https://mockmind-api.uifaces.co/content/human/' ||
      ((abs(hashtext(coalesce(new.raw_user_meta_data->>'username', new.id::text))) % 222) + 1)::text ||
      '.jpg'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill email for existing profiles (username login needs this).
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;


-- ============================================================================
-- 3. Posts
-- One table for all content types, discriminated by post_type. Events and
-- celebrations ride along as jsonb payloads on regular posts.
-- ============================================================================

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image text,
  images text[],
  media_layout text,
  post_type text default 'post' not null,
  title text,
  event jsonb,
  celebration jsonb,
  likes_count integer default 0 not null,
  comments_count integer default 0 not null,
  shares_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint posts_post_type_check check (post_type in ('post', 'article', 'event'))
);

comment on column public.posts.event is
  'Optional event payload: { title, startsAt, endsAt?, location? }';
comment on column public.posts.celebration is
  'Optional celebration payload: { occasion, message? }';

grant select on table public.posts to anon, authenticated;

alter table public.posts enable row level security;

drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create their own posts" on public.posts;
create policy "Users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_post()
returns trigger as $$
begin
  update public.profiles
  set posts_count = posts_count + 1
  where id = new.author_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_created on public.posts;
create trigger on_post_created
  after insert on public.posts
  for each row execute function public.handle_new_post();


-- ============================================================================
-- 4. Post reactions
-- (post_id, user_id) PK = one reaction per user per post. likes_count on
-- posts counts reactors, so changing a reaction type doesn't move the count.
-- ============================================================================

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction text default 'like' not null,
  created_at timestamptz default now() not null,
  primary key (post_id, user_id)
);

-- Late-added reaction column for databases created before it existed.
alter table public.post_likes
  add column if not exists reaction text default 'like' not null;

alter table public.post_likes
  drop constraint if exists post_likes_reaction_check;

alter table public.post_likes
  add constraint post_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

create index if not exists post_likes_user_id_idx on public.post_likes (user_id);
create index if not exists post_likes_post_id_idx on public.post_likes (post_id);

alter table public.post_likes enable row level security;

drop policy if exists "Post likes are viewable by everyone" on public.post_likes;
create policy "Post likes are viewable by everyone"
  on public.post_likes for select
  using (true);

drop policy if exists "Users can like posts" on public.post_likes;
create policy "Users can like posts"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike their own likes" on public.post_likes;
create policy "Users can unlike their own likes"
  on public.post_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own likes" on public.post_likes;
create policy "Users can update their own likes"
  on public.post_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_post_like_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set likes_count = likes_count + 1
  where id = new.post_id;
  return new;
end;
$$;

create or replace function public.handle_post_like_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set likes_count = greatest(likes_count - 1, 0)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists on_post_like_created on public.post_likes;
create trigger on_post_like_created
  after insert on public.post_likes
  for each row execute function public.handle_post_like_insert();

drop trigger if exists on_post_like_deleted on public.post_likes;
create trigger on_post_like_deleted
  after delete on public.post_likes
  for each row execute function public.handle_post_like_delete();

-- Atomically read-modify-write a reactor's reaction and hand back the post's
-- current reaction + likes_count in one round trip, instead of the client
-- doing a select-then-upsert-then-separate-count-read (a TOCTOU race under
-- concurrent clicks). security invoker keeps the existing RLS policies
-- (auth.uid() = user_id) in force.
create or replace function public.set_post_reaction(
  p_post_id uuid,
  p_user_id uuid,
  p_reaction text
)
returns table (reaction text, likes_count integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing text;
begin
  select pl.reaction into v_existing
  from public.post_likes pl
  where pl.post_id = p_post_id and pl.user_id = p_user_id
  for update;

  if v_existing is not null and v_existing = p_reaction then
    delete from public.post_likes
    where post_id = p_post_id and user_id = p_user_id;

    return query
      select null::text, p.likes_count from public.posts p where p.id = p_post_id;
    return;
  end if;

  insert into public.post_likes (post_id, user_id, reaction)
  values (p_post_id, p_user_id, p_reaction)
  on conflict (post_id, user_id)
  do update set reaction = excluded.reaction;

  return query
    select p_reaction, p.likes_count from public.posts p where p.id = p_post_id;
end;
$$;

create or replace function public.clear_post_reaction(
  p_post_id uuid,
  p_user_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.post_likes
  where post_id = p_post_id and user_id = p_user_id;

  return (select likes_count from public.posts where id = p_post_id);
end;
$$;

grant execute on function public.set_post_reaction(uuid, uuid, text) to authenticated;
grant execute on function public.clear_post_reaction(uuid, uuid) to authenticated;


-- ============================================================================
-- 5. Comments
-- Flat table with self-referencing parent_id for one-level replies. Only
-- top-level comments count toward posts.comments_count.
-- ============================================================================

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  likes_count integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Late-added counter for databases created before it existed.
alter table public.comments
  add column if not exists likes_count integer default 0 not null;

create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_author_id_idx on public.comments (author_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "Users can create comments" on public.comments;
create policy "Users can create comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = author_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

create or replace function public.handle_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_id is null then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id;
  end if;
  return new;
end;
$$;

create or replace function public.handle_comment_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.parent_id is null then
    update public.posts
    set comments_count = greatest(comments_count - 1, 0)
    where id = old.post_id;
  end if;
  return old;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.handle_comment_insert();

drop trigger if exists on_comment_deleted on public.comments;
create trigger on_comment_deleted
  after delete on public.comments
  for each row execute function public.handle_comment_delete();


-- ============================================================================
-- 6. Comment reactions
-- Same pattern as post reactions: (comment_id, user_id) PK, reaction enum,
-- triggers keeping comments.likes_count in sync.
-- ============================================================================

create table if not exists public.comment_likes (
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction text default 'like' not null,
  created_at timestamptz default now() not null,
  primary key (comment_id, user_id)
);

-- Late-added reaction column for databases created before it existed.
alter table public.comment_likes
  add column if not exists reaction text default 'like' not null;

alter table public.comment_likes
  drop constraint if exists comment_likes_reaction_check;

alter table public.comment_likes
  add constraint comment_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

create index if not exists comment_likes_user_id_idx on public.comment_likes (user_id);
create index if not exists comment_likes_comment_id_idx on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

drop policy if exists "Comment likes are viewable by everyone" on public.comment_likes;
create policy "Comment likes are viewable by everyone"
  on public.comment_likes for select
  using (true);

drop policy if exists "Users can like comments" on public.comment_likes;
create policy "Users can like comments"
  on public.comment_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike their own comment likes" on public.comment_likes;
create policy "Users can unlike their own comment likes"
  on public.comment_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own comment likes" on public.comment_likes;
create policy "Users can update their own comment likes"
  on public.comment_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_comment_like_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comments
  set likes_count = likes_count + 1
  where id = new.comment_id;
  return new;
end;
$$;

create or replace function public.handle_comment_like_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comments
  set likes_count = greatest(likes_count - 1, 0)
  where id = old.comment_id;
  return old;
end;
$$;

drop trigger if exists on_comment_like_created on public.comment_likes;
create trigger on_comment_like_created
  after insert on public.comment_likes
  for each row execute function public.handle_comment_like_insert();

drop trigger if exists on_comment_like_deleted on public.comment_likes;
create trigger on_comment_like_deleted
  after delete on public.comment_likes
  for each row execute function public.handle_comment_like_delete();


-- ============================================================================
-- 7. Follows
-- Triggers update both profiles' counters symmetrically, clamped at 0.
-- ============================================================================

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


-- ============================================================================
-- 8. Post shares
-- Sending a post to a specific person. Private: only sender and recipient
-- can see the share row.
-- ============================================================================

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


-- ============================================================================
-- 9. Saved posts
-- Private bookmarks: RLS restricts every operation to the owner.
-- ============================================================================

create table if not exists public.post_saves (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, post_id)
);

create index if not exists post_saves_user_id_idx on public.post_saves (user_id);
create index if not exists post_saves_post_id_idx on public.post_saves (post_id);
create index if not exists post_saves_created_at_idx on public.post_saves (created_at desc);

alter table public.post_saves enable row level security;

drop policy if exists "Users can view their own saved posts" on public.post_saves;
create policy "Users can view their own saved posts"
  on public.post_saves for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save posts" on public.post_saves;
create policy "Users can save posts"
  on public.post_saves for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unsave posts" on public.post_saves;
create policy "Users can unsave posts"
  on public.post_saves for delete
  using (auth.uid() = user_id);


-- ============================================================================
-- 10. Direct messaging
-- RLS funnels through is_conversation_member() (security definer) — a naive
-- membership-checks-membership policy would recurse infinitely.
-- ============================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz default now() not null,
  joined_at timestamptz default now() not null,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_id_idx
  on public.conversation_members (user_id);
create index if not exists conversation_members_conversation_id_idx
  on public.conversation_members (conversation_id);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz default now() not null
);

create index if not exists direct_messages_conversation_id_created_at_idx
  on public.direct_messages (conversation_id, created_at asc);
create index if not exists direct_messages_sender_id_idx
  on public.direct_messages (sender_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.direct_messages enable row level security;

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conv_id
      and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;

drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations for select
  using (public.is_conversation_member(id));

drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

drop policy if exists "Members can update conversations" on public.conversations;
create policy "Members can update conversations"
  on public.conversations for update
  using (public.is_conversation_member(id));

drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Users can join conversations as themselves" on public.conversation_members;
create policy "Users can join conversations as themselves"
  on public.conversation_members for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own membership" on public.conversation_members;
create policy "Users can update their own membership"
  on public.conversation_members for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Members can view messages" on public.direct_messages;
create policy "Members can view messages"
  on public.direct_messages for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Members can send messages" on public.direct_messages;
create policy "Members can send messages"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );

-- Atomically find or create the 1:1 conversation with another profile.
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if other_user_id is null or other_user_id = me then
    raise exception 'Invalid conversation partner';
  end if;

  if not exists (select 1 from public.profiles p where p.id = other_user_id) then
    raise exception 'User not found';
  end if;

  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  inner join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  where cm1.user_id = me
    and cm2.user_id = other_user_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations default values
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (conv_id, me),
    (conv_id, other_user_id);

  return conv_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- Bump conversations.updated_at on every message so inboxes sort by recency.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_direct_message_created on public.direct_messages;
create trigger on_direct_message_created
  after insert on public.direct_messages
  for each row execute function public.touch_conversation_on_message();


-- ============================================================================
-- 11. Notifications
-- Fan-out rows written by triggers on likes, comments, messages, follows.
-- Private: only the recipient can read/update/delete.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('like', 'comment', 'message', 'follow', 'mention', 'system', 'event')),
  message text not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = recipient_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = recipient_id);

-- Likes → notify post author (skip self-likes).
create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author
  from public.posts
  where id = new.post_id;

  if post_author is null or post_author = new.user_id then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    message,
    post_id
  )
  values (
    post_author,
    new.user_id,
    'like',
    'liked your post',
    new.post_id
  );

  return new;
end;
$$;

drop trigger if exists on_post_like_notify on public.post_likes;
create trigger on_post_like_notify
  after insert on public.post_likes
  for each row execute function public.notify_on_post_like();

-- Comments → notify post author (and parent comment author on replies).
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  parent_author uuid;
  preview text;
begin
  preview := left(trim(new.content), 80);

  select author_id into post_author
  from public.posts
  where id = new.post_id;

  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      message,
      post_id,
      comment_id
    )
    values (
      post_author,
      new.author_id,
      'comment',
      case
        when preview = '' then 'commented on your post'
        else 'commented: ' || preview
      end,
      new.post_id,
      new.id
    );
  end if;

  if new.parent_id is not null then
    select author_id into parent_author
    from public.comments
    where id = new.parent_id;

    if parent_author is not null
       and parent_author <> new.author_id
       and parent_author is distinct from post_author then
      insert into public.notifications (
        recipient_id,
        actor_id,
        type,
        message,
        post_id,
        comment_id
      )
      values (
        parent_author,
        new.author_id,
        'comment',
        case
          when preview = '' then 'replied to your comment'
          else 'replied: ' || preview
        end,
        new.post_id,
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Direct messages → notify other conversation members.
create or replace function public.notify_on_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member record;
  preview text;
begin
  preview := left(trim(new.content), 80);

  for member in
    select user_id
    from public.conversation_members
    where conversation_id = new.conversation_id
      and user_id <> new.sender_id
  loop
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      message,
      conversation_id
    )
    values (
      member.user_id,
      new.sender_id,
      'message',
      case
        when preview = '' then 'sent you a message'
        else 'sent you a message: ' || preview
      end,
      new.conversation_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_direct_message_notify on public.direct_messages;
create trigger on_direct_message_notify
  after insert on public.direct_messages
  for each row execute function public.notify_on_direct_message();

-- Follows → notify the followed user.
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.following_id = new.follower_id then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    message
  )
  values (
    new.following_id,
    new.follower_id,
    'follow',
    'started following you'
  );

  return new;
end;
$$;

drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- Event posts → notify the author's followers.
-- Event posts are discriminated by a non-null `event` payload.
create or replace function public.notify_on_event_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event is null then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    message,
    post_id
  )
  select
    f.follower_id,
    new.author_id,
    'event',
    'posted a new event',
    new.id
  from public.follows f
  where f.following_id = new.author_id
    and f.follower_id <> new.author_id;

  return new;
end;
$$;

drop trigger if exists on_event_post_notify on public.posts;
create trigger on_event_post_notify
  after insert on public.posts
  for each row execute function public.notify_on_event_post();


-- ============================================================================
-- 12. Realtime
-- replica identity full so change payloads carry every column; publication
-- membership only for tables the app actually subscribes to (live reactions,
-- chat delivery, notification badges).
-- ============================================================================

alter table public.posts replica identity full;
alter table public.post_likes replica identity full;
alter table public.comments replica identity full;
alter table public.comment_likes replica identity full;
alter table public.follows replica identity full;
alter table public.post_shares replica identity full;
alter table public.direct_messages replica identity full;
alter table public.conversation_members replica identity full;
alter table public.notifications replica identity full;

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['posts', 'post_likes', 'direct_messages', 'conversation_members', 'notifications'] loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;


-- ============================================================================
-- 13. Storage
-- Public-read bucket for post media. Uploads for any authenticated user;
-- update/delete restricted to files under the user's own folder
-- (first path segment must equal auth.uid()).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view post media" on storage.objects;
create policy "Anyone can view post media"
  on storage.objects for select
  using (bucket_id = 'post-media');

drop policy if exists "Authenticated users can upload post media" on storage.objects;
create policy "Authenticated users can upload post media"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can update own post media" on storage.objects;
create policy "Users can update own post media"
  on storage.objects for update
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own post media" on storage.objects;
create policy "Users can delete own post media"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
