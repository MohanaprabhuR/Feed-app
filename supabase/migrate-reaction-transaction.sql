-- Atomic reaction read-modify-write.
-- Run this if you already applied migrate-reactions.sql earlier.
--
-- Replaces the client-side select-then-upsert-then-separate-count-read in
-- lib/likes.ts (setReaction/clearReaction) with a single round trip that
-- runs inside one Postgres transaction, removing the TOCTOU race that let
-- concurrent clicks on the same post/user produce inconsistent state.

create or replace function public.set_post_reaction(
  p_post_id uuid,
  p_user_id uuid,
  p_reaction text
)
returns table (reaction text, likes_count integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing text;
begin
  select pl.reaction into v_existing
  from public.post_likes pl
  where pl.post_id = p_post_id and pl.user_id = p_user_id
  for update;

  if v_existing is not null and v_existing = p_reaction then
    delete from public.post_likes
    where post_id = p_post_id and user_id = p_user_id;

    return query
      select null::text, p.likes_count from public.posts p where p.id = p_post_id;
    return;
  end if;

  insert into public.post_likes (post_id, user_id, reaction)
  values (p_post_id, p_user_id, p_reaction)
  on conflict (post_id, user_id)
  do update set reaction = excluded.reaction;

  return query
    select p_reaction, p.likes_count from public.posts p where p.id = p_post_id;
end;
$$;

create or replace function public.clear_post_reaction(
  p_post_id uuid,
  p_user_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.post_likes
  where post_id = p_post_id and user_id = p_user_id;

  return (select likes_count from public.posts where id = p_post_id);
end;
$$;

grant execute on function public.set_post_reaction(uuid, uuid, text) to authenticated;
grant execute on function public.clear_post_reaction(uuid, uuid) to authenticated;
