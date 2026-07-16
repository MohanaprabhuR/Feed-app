-- Event details on posts (LinkedIn-style create event attachment)
-- Run in Supabase → SQL Editor (safe to re-run)

alter table public.posts
  add column if not exists event jsonb;

comment on column public.posts.event is
  'Optional event payload: { title, startsAt, endsAt?, location? }';

-- Allow post_type = 'event' (articles migration only allowed post/article)
alter table public.posts
  drop constraint if exists posts_post_type_check;

alter table public.posts
  add constraint posts_post_type_check
  check (post_type in ('post', 'article', 'event'));
