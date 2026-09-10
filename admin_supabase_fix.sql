-- Run this once in Supabase SQL Editor.
-- It lets an authenticated admin check their own admin_users row.
create policy "Admins can view their own admin row"
on public.admin_users
for select
to authenticated
using (id = auth.uid());
