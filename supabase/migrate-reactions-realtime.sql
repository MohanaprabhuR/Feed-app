-- Enable live reaction delivery for post_likes.
-- Run this if you already applied migrate-reactions.sql earlier.

alter table public.post_likes replica identity full;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'post_likes'
    ) then
      alter publication supabase_realtime add table public.post_likes;
    end if;
  end if;
end;
$$;
