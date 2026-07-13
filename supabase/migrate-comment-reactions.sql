-- Comment reaction types (same as post likes)
-- Run after migrate-comment-likes.sql. Safe to re-run.

alter table public.comment_likes
  add column if not exists reaction text default 'like' not null;

alter table public.comment_likes
  drop constraint if exists comment_likes_reaction_check;

alter table public.comment_likes
  add constraint comment_likes_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

update public.comment_likes
set reaction = 'like'
where reaction is null or reaction = '';
