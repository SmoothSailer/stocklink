-- Migration 009: Murabaha BNPL (Buy Now Pay Later) installment plans
-- Implements Islamic Murabaha financing:
--   1. Seller discloses cost price + adds transparent markup (profit)
--   2. Buyer agrees to total (cost + markup) split into fixed installments
--   3. Schedule is agreed upfront with due dates

-- BNPL plan linked to an order
create table if not exists public.bnpl_plans (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  cost_price numeric not null check (cost_price >= 0),
  markup_amount numeric not null check (markup_amount >= 0),
  total_with_markup numeric not null check (total_with_markup > 0),
  num_installments integer not null check (num_installments >= 2 and num_installments <= 24),
  installment_amount numeric not null check (installment_amount > 0),
  agreed_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Individual installments with due dates
create table if not exists public.bnpl_installments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.bnpl_plans(id) on delete cascade,
  installment_number integer not null,
  amount numeric not null check (amount > 0),
  due_date date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'due', 'paid', 'overdue')),
  paid_at timestamptz,
  payment_record_id uuid references public.payment_records(id) on delete set null,
  created_at timestamptz default now(),
  unique (plan_id, installment_number)
);

-- Indexes
create index if not exists idx_bnpl_plans_order_id on public.bnpl_plans(order_id);
create index if not exists idx_bnpl_installments_plan_id on public.bnpl_installments(plan_id);
create index if not exists idx_bnpl_installments_due_date on public.bnpl_installments(due_date);
create index if not exists idx_bnpl_installments_status on public.bnpl_installments(status);

-- RLS
alter table public.bnpl_plans enable row level security;
alter table public.bnpl_installments enable row level security;

-- Admin/service role full access
create policy "bnpl_plans_admin_all"
  on public.bnpl_plans for all
  using (true) with check (true);

create policy "bnpl_installments_admin_all"
  on public.bnpl_installments for all
  using (true) with check (true);

-- Retailers can view their own BNPL plans
create policy "bnpl_plans_retailer_select"
  on public.bnpl_plans for select
  using (
    exists (
      select 1 from public.orders o
      join public.retailers r on r.id = o.retailer_id
      where o.id = bnpl_plans.order_id
        and r.user_id = auth.uid()
    )
  );

create policy "bnpl_installments_retailer_select"
  on public.bnpl_installments for select
  using (
    exists (
      select 1 from public.bnpl_plans p
      join public.orders o on o.id = p.order_id
      join public.retailers r on r.id = o.retailer_id
      where p.id = bnpl_installments.plan_id
        and r.user_id = auth.uid()
    )
  );
