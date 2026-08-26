-- Live read receipts: peers see last_read_at updates for WhatsApp-style ticks.
-- Run in Supabase → SQL Editor. Safe to re-run.

alter table public.conversation_members replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'conversation_members'
    ) then
      alter publication supabase_realtime add table public.conversation_members;
    end if;
  end if;
end $$;
