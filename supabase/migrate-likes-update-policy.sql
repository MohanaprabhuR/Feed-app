-- Fix post/comment reaction updates blocked by missing UPDATE RLS.
-- Safe to re-run.

drop policy if exists "Users can update their own likes" on public.post_likes;
create policy "Users can update their own likes"
  on public.post_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own comment likes" on public.comment_likes;
create policy "Users can update their own comment likes"
  on public.comment_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
