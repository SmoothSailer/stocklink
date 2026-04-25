-- Add product_unit_options table for products that can be sold in multiple units
-- e.g., Takis Fuego: default is pieces (MOQ 24, KSh 50/piece)
--       but also sold in boxes (MOQ 1, KSh 1200/box)
--
-- The product-level price/unit/stock/min_order_qty remain the DEFAULT unit.
-- Rows in this table represent ADDITIONAL unit options.

create table if not exists public.product_unit_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  unit_slug text not null,
  price numeric not null check (price >= 0),
  stock integer not null default 0,
  min_order_qty integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  unique(product_id, unit_slug)
);

-- Index for fast lookups by product
create index if not exists idx_product_unit_options_product on public.product_unit_options(product_id);

-- RLS policies
alter table public.product_unit_options enable row level security;

-- Anyone can read product unit options (needed for retailer product display)
drop policy if exists "Anyone can read product unit options" on public.product_unit_options;
create policy "Anyone can read product unit options"
  on public.product_unit_options for select
  using (true);

-- Authenticated users can manage product unit options
drop policy if exists "Authenticated users can manage product unit options" on public.product_unit_options;
create policy "Authenticated users can manage product unit options"
  on public.product_unit_options for all
  to authenticated
  using (true);

-- Track which unit the customer ordered in (on order_items)
alter table public.order_items
  add column if not exists unit text;
