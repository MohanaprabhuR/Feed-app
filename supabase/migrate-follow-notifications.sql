-- Notify users when someone follows them.
-- Run after migrate-notifications.sql and migrate-follows-shares.sql.

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.following_id = new.follower_id then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    message
  )
  values (
    new.following_id,
    new.follower_id,
    'follow',
    'started following you'
  );

  return new;
end;
$$;

drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();
