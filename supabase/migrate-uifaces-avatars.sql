-- Switch default / existing pravatar URLs to UI Faces human avatars:
-- https://uifaces.co/category/human (mockmind-api.uifaces.co)
-- Safe to re-run.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'https://mockmind-api.uifaces.co/content/human/' ||
      ((abs(hashtext(coalesce(new.raw_user_meta_data->>'username', new.id::text))) % 222) + 1)::text ||
      '.jpg'
  );
  return new;
end;
$$ language plpgsql security definer;

update public.profiles
set avatar =
  'https://mockmind-api.uifaces.co/content/human/' ||
  ((abs(hashtext(coalesce(username, id::text))) % 222) + 1)::text ||
  '.jpg'
where avatar is null
   or avatar = ''
   or avatar like 'https://i.pravatar.cc/%';
