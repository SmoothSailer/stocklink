-- Add manufacturers table for tracking product brands/makers
-- e.g. "Pembe Flour Co.", "Bidco Africa", "Ketepa Ltd"

create table if not exists public.manufacturers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  description text,
  location text,
  website text,
  contact_person text,
  contact_phone text,
  contact_email text,
  sales_rep_id uuid references public.sales_reps(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Index for active manufacturers (used in dropdowns and listings)
create index if not exists idx_manufacturers_active on public.manufacturers(is_active) where is_active = true;

-- Index for sales rep assignment
create index if not exists idx_manufacturers_sales_rep on public.manufacturers(sales_rep_id);

-- Add manufacturer_id FK to products
alter table public.products
  add column if not exists manufacturer_id uuid references public.manufacturers(id) on delete set null;

-- Index for filtering products by manufacturer
create index if not exists idx_products_manufacturer on public.products(manufacturer_id);

-- RLS policies
alter table public.manufacturers enable row level security;

-- Anyone can read active manufacturers
drop policy if exists "Anyone can read active manufacturers" on public.manufacturers;
create policy "Anyone can read active manufacturers"
  on public.manufacturers for select
  using (is_active = true);

-- Authenticated users can read all manufacturers (for admin/sales-rep)
drop policy if exists "Authenticated users can read all manufacturers" on public.manufacturers;
create policy "Authenticated users can read all manufacturers"
  on public.manufacturers for select
  to authenticated
  using (true);

-- Authenticated users can manage manufacturers (insert/update/delete)
drop policy if exists "Authenticated users can manage manufacturers" on public.manufacturers;
create policy "Authenticated users can manage manufacturers"
  on public.manufacturers for all
  to authenticated
  using (true);
