-- Add user_id to sales_reps so reps can log in and access their dashboard
alter table public.sales_reps
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

-- Index for fast lookup by user_id
create index if not exists idx_sales_reps_user on public.sales_reps(user_id);

-- RLS policy: sales reps can read their own record
drop policy if exists "Sales reps can read own record" on public.sales_reps;
create policy "Sales reps can read own record"
  on public.sales_reps for select
  using (auth.uid() = user_id);
