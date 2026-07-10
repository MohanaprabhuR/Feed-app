-- Post media storage bucket (optional if using SUPABASE_SERVICE_ROLE_KEY)
-- Option A (recommended): add SUPABASE_SERVICE_ROLE_KEY to .env.local — bucket auto-creates on first upload.
-- Option B: run this SQL in Supabase SQL Editor for direct client uploads.
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view post media" on storage.objects;
create policy "Anyone can view post media"
  on storage.objects for select
  using (bucket_id = 'post-media');

drop policy if exists "Authenticated users can upload post media" on storage.objects;
create policy "Authenticated users can upload post media"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can update own post media" on storage.objects;
create policy "Users can update own post media"
  on storage.objects for update
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own post media" on storage.objects;
create policy "Users can delete own post media"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
