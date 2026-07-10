-- Run ONLY this if you already ran the original schema and just need the email column.
-- Safe to re-run.

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'https://i.pravatar.cc/150?u=' || coalesce(new.raw_user_meta_data->>'username', new.id::text)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
