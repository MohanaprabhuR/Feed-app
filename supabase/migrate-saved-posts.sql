-- Saved / bookmarked posts for the current user.
-- Safe to re-run.

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
