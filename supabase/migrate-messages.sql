-- Direct messaging (1:1 conversations + message history).
-- Run in Supabase → SQL Editor. Safe to re-run.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz default now() not null,
  joined_at timestamptz default now() not null,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_id_idx
  on public.conversation_members (user_id);
create index if not exists conversation_members_conversation_id_idx
  on public.conversation_members (conversation_id);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz default now() not null
);

create index if not exists direct_messages_conversation_id_created_at_idx
  on public.direct_messages (conversation_id, created_at asc);
create index if not exists direct_messages_sender_id_idx
  on public.direct_messages (sender_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.direct_messages enable row level security;

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conv_id
      and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;

drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations for select
  using (public.is_conversation_member(id));

drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

drop policy if exists "Members can update conversations" on public.conversations;
create policy "Members can update conversations"
  on public.conversations for update
  using (public.is_conversation_member(id));

drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Users can join conversations as themselves" on public.conversation_members;
create policy "Users can join conversations as themselves"
  on public.conversation_members for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Members can view messages" on public.direct_messages;
create policy "Members can view messages"
  on public.direct_messages for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Members can send messages" on public.direct_messages;
create policy "Members can send messages"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );

-- Create or return the 1:1 conversation between the current user and another profile.
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if other_user_id is null or other_user_id = me then
    raise exception 'Invalid conversation partner';
  end if;

  if not exists (select 1 from public.profiles p where p.id = other_user_id) then
    raise exception 'User not found';
  end if;

  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  inner join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  where cm1.user_id = me
    and cm2.user_id = other_user_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations default values
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (conv_id, me),
    (conv_id, other_user_id);

  return conv_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_direct_message_created on public.direct_messages;
create trigger on_direct_message_created
  after insert on public.direct_messages
  for each row execute function public.touch_conversation_on_message();
