-- Celebration details on posts (LinkedIn-style "Celebrate an occasion" attachment)
-- Run in Supabase → SQL Editor (safe to re-run)

alter table public.posts
  add column if not exists celebration jsonb;

comment on column public.posts.celebration is
  'Optional celebration payload: { occasion, message? }';
