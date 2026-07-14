-- Run this in the Supabase SQL Editor (Dashboard → SQL)
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS

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

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists zip_code text;

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

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

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

-- Backfill email for existing profiles (username login needs this)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Posts
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image text,
  post_type text default 'post' not null,
  title text,
  likes_count integer default 0 not null,
  comments_count integer default 0 not null,
  shares_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

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

alter table public.posts replica identity full;

-- Post likes
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (post_id, user_id)
);

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

-- Comments
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now() not null
);

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

alter table public.post_likes replica identity full;
alter table public.comments replica identity full;

alter table public.post_likes
  add column if not exists reaction text default 'like' not null;

alter table public.post_likes
  drop constraint if exists post_likes_reaction_check;

alter table public.post_likes
  add constraint post_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

alter table public.comments
  add column if not exists likes_count integer default 0 not null;

create table if not exists public.comment_likes (
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (comment_id, user_id)
);

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

alter table public.comment_likes replica identity full;

alter table public.comment_likes
  add column if not exists reaction text default 'like' not null;

alter table public.comment_likes
  drop constraint if exists comment_likes_reaction_check;

alter table public.comment_likes
  add constraint comment_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

-- Follows
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

-- Post shares
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

-- Saved posts
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

-- Direct messaging
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

alter table public.direct_messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.direct_messages;
exception
  when duplicate_object then null;
end $$;

