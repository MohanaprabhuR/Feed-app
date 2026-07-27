-- Notify a user's followers when they post an event.
-- Run in Supabase → SQL Editor. Safe to re-run.
-- Requires: migrate-notifications.sql, migrate-post-events.sql, migrate-follows-shares.sql.

-- 1. Allow the new 'event' notification type.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('like', 'comment', 'message', 'follow', 'mention', 'system', 'event'));

-- 2. On a new event post, notify every follower of the author.
--    Event posts are discriminated by a non-null `event` payload (the app keeps
--    post_type = 'post' for compatibility), so key off `new.event`.
create or replace function public.notify_on_event_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event is null then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    message,
    post_id
  )
  select
    f.follower_id,
    new.author_id,
    'event',
    'posted a new event',
    new.id
  from public.follows f
  where f.following_id = new.author_id
    and f.follower_id <> new.author_id;

  return new;
end;
$$;

drop trigger if exists on_event_post_notify on public.posts;
create trigger on_event_post_notify
  after insert on public.posts
  for each row execute function public.notify_on_event_post();
