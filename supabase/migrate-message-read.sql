-- Allow users to update their own conversation membership (last_read_at).
-- Run in Supabase → SQL Editor. Safe to re-run.

drop policy if exists "Users can update their own membership" on public.conversation_members;
create policy "Users can update their own membership"
  on public.conversation_members for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
