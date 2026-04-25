-- Migration 008: Payment tracking
-- Adds payment_status, amount_paid, paid_at to orders
-- Adds 'bnpl' payment method
-- Creates payment_records table for tracking individual payments

-- 1. Add payment tracking columns to orders
alter table public.orders
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'partial', 'paid', 'failed')),
  add column if not exists amount_paid numeric not null default 0
    check (amount_paid >= 0),
  add column if not exists paid_at timestamptz;

-- 2. Expand payment_method constraint to include 'bnpl'
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
    check (payment_method in ('mpesa', 'cash', 'card', 'bnpl'));

-- 3. Create payment_records table
create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text not null default 'mpesa'
    check (method in ('mpesa', 'cash', 'card')),
  reference text,
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_payment_records_order_id on public.payment_records(order_id);
create index if not exists idx_payment_records_created_at on public.payment_records(created_at);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

-- RLS
alter table public.payment_records enable row level security;

-- Admins and service role can do everything
create policy "payment_records_admin_all"
  on public.payment_records for all
  using (true)
  with check (true);

-- Retailers can view their own order payments
create policy "payment_records_retailer_select"
  on public.payment_records for select
  using (
    exists (
      select 1 from public.orders o
      join public.retailers r on r.id = o.retailer_id
      where o.id = payment_records.order_id
        and r.user_id = auth.uid()
    )
  );
