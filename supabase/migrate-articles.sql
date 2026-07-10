-- Articles support on posts table
-- Safe to re-run.

alter table public.posts
  add column if not exists post_type text default 'post' not null;

alter table public.posts
  add column if not exists title text;

alter table public.posts
  drop constraint if exists posts_post_type_check;

alter table public.posts
  add constraint posts_post_type_check
  check (post_type in ('post', 'article'));
