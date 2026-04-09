-- Product media table for multiple images and short videos per product

create table if not exists public.product_media (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  type text not null default 'image' check (type in ('image', 'video')),
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Index for fetching media by product (most common query)
create index if not exists idx_product_media_product on public.product_media(product_id, sort_order);

-- RLS policies
alter table public.product_media enable row level security;

-- Anyone can read product media
drop policy if exists "Anyone can read product media" on public.product_media;
create policy "Anyone can read product media"
  on public.product_media for select
  using (true);

-- Authenticated users can manage product media
drop policy if exists "Authenticated users can manage product media" on public.product_media;
create policy "Authenticated users can manage product media"
  on public.product_media for all
  to authenticated
  using (true);
