-- Post reaction types (LinkedIn-style)
-- Run after migrate-likes-comments.sql. Safe to re-run.

alter table public.post_likes
  add column if not exists reaction text default 'like' not null;

alter table public.post_likes
  drop constraint if exists post_likes_reaction_check;

alter table public.post_likes
  add constraint post_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

update public.post_likes
set reaction = 'like'
where reaction is null or reaction = '';
