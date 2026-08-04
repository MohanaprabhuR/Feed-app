-- Multiple images per post.
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Posts historically stored a single media URL in `image`. This adds an
-- `images` array for multi-image posts; `image` still holds the first image
-- for backward compatibility, so existing single-image posts keep rendering.

alter table public.posts add column if not exists images text[];
