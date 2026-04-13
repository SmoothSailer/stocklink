-- Migration: Add down_payment columns to bnpl_plans
alter table public.bnpl_plans
  add column if not exists down_payment_rate numeric not null default 0.3
    check (down_payment_rate >= 0 and down_payment_rate <= 1),
  add column if not exists down_payment numeric not null default 0
    check (down_payment >= 0);
