-- Enable live chat delivery for direct_messages.
-- Run if you already applied migrate-messages.sql earlier.

alter table public.direct_messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.direct_messages;
exception
  when duplicate_object then null;
end $$;
