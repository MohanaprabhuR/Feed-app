-- Post likes and comments
-- Run in Supabase SQL Editor. Safe to re-run.

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

-- Reaction types on likes
alter table public.post_likes
  add column if not exists reaction text default 'like' not null;

alter table public.post_likes
  drop constraint if exists post_likes_reaction_check;

alter table public.post_likes
  add constraint post_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

-- Comment likes
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
