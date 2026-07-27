-- Live feed: broadcast new posts to open feeds via Supabase Realtime.
-- Run this if you applied schema.sql before `posts` was added to the
-- realtime publication. Safe to re-run.

alter table public.posts replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'posts'
    ) then
      alter publication supabase_realtime add table public.posts;
    end if;
  end if;
end;
$$;
