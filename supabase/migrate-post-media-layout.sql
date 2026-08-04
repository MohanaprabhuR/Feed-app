-- Per-post image layout: "grid" (default collage) or "slider" (carousel).
-- Run in Supabase → SQL Editor. Safe to re-run.

alter table public.posts add column if not exists media_layout text;
