-- In-app notifications for likes, comments, and messages.
-- Run in Supabase → SQL Editor. Safe to re-run.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('like', 'comment', 'message', 'follow', 'mention', 'system')),
  message text not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = recipient_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = recipient_id);

-- Likes → notify post author
create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author
  from public.posts
  where id = new.post_id;

  if post_author is null or post_author = new.user_id then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    message,
    post_id
  )
  values (
    post_author,
    new.user_id,
    'like',
    'liked your post',
    new.post_id
  );

  return new;
end;
$$;

drop trigger if exists on_post_like_notify on public.post_likes;
create trigger on_post_like_notify
  after insert on public.post_likes
  for each row execute function public.notify_on_post_like();

-- Comments → notify post author (and parent comment author on replies)
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  parent_author uuid;
  preview text;
begin
  preview := left(trim(new.content), 80);

  select author_id into post_author
  from public.posts
  where id = new.post_id;

  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      message,
      post_id,
      comment_id
    )
    values (
      post_author,
      new.author_id,
      'comment',
      case
        when preview = '' then 'commented on your post'
        else 'commented: ' || preview
      end,
      new.post_id,
      new.id
    );
  end if;

  if new.parent_id is not null then
    select author_id into parent_author
    from public.comments
    where id = new.parent_id;

    if parent_author is not null
       and parent_author <> new.author_id
       and parent_author is distinct from post_author then
      insert into public.notifications (
        recipient_id,
        actor_id,
        type,
        message,
        post_id,
        comment_id
      )
      values (
        parent_author,
        new.author_id,
        'comment',
        case
          when preview = '' then 'replied to your comment'
          else 'replied: ' || preview
        end,
        new.post_id,
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Direct messages → notify other conversation members
create or replace function public.notify_on_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member record;
  preview text;
begin
  preview := left(trim(new.content), 80);

  for member in
    select user_id
    from public.conversation_members
    where conversation_id = new.conversation_id
      and user_id <> new.sender_id
  loop
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      message,
      conversation_id
    )
    values (
      member.user_id,
      new.sender_id,
      'message',
      case
        when preview = '' then 'sent you a message'
        else 'sent you a message: ' || preview
      end,
      new.conversation_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_direct_message_notify on public.direct_messages;
create trigger on_direct_message_notify
  after insert on public.direct_messages
  for each row execute function public.notify_on_direct_message();

alter table public.notifications replica identity full;

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
        and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end;
$$;
