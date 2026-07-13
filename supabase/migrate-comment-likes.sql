-- Comment likes
-- Run after migrate-likes-comments.sql. Safe to re-run.

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
