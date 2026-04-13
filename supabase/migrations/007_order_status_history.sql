-- Order Status History
-- Tracks every status transition with timestamp, actor, and notes.

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null
    check (status in ('placed', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  changed_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_order_status_history_order
  on public.order_status_history(order_id);

create index if not exists idx_order_status_history_created
  on public.order_status_history(order_id, created_at);

-- RLS
alter table public.order_status_history enable row level security;

-- Authenticated users can read status history for orders they can see
create policy "Authenticated users can read order status history"
  on public.order_status_history for select
  to authenticated
  using (true);

-- Only authenticated users can insert history entries
create policy "Authenticated users can insert order status history"
  on public.order_status_history for insert
  to authenticated
  with check (true);
