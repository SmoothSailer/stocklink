-- StockLink Database Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- ============================================
-- 1. EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- 2. TABLES
-- ============================================

-- Sales Representatives
create table if not exists public.sales_reps (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  whatsapp_phone text not null,
  email text,
  avatar_url text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Wholesalers
create table if not exists public.wholesalers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  phone text,
  sales_rep_id uuid references public.sales_reps(id) on delete set null,
  created_at timestamptz default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text not null,
  price numeric not null check (price >= 0),
  unit text not null default 'bag',
  min_order_qty integer not null default 1,
  stock integer not null default 0,
  image_url text,
  wholesaler_id uuid references public.wholesalers(id) on delete set null,
  is_trending boolean not null default false,
  is_flash_deal boolean not null default false,
  flash_deal_price numeric check (flash_deal_price >= 0),
  flash_deal_expires_at timestamptz,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Retailers
create table if not exists public.retailers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  location text,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  retailer_id uuid references public.retailers(id) on delete set null,
  status text not null default 'placed'
    check (status in ('placed', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  total numeric not null check (total >= 0),
  delivery_address text not null,
  payment_method text not null default 'mpesa'
    check (payment_method in ('mpesa', 'cash', 'card')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total_price numeric not null check (total_price >= 0)
);

-- Demand Requests
create table if not exists public.demand_requests (
  id uuid primary key default uuid_generate_v4(),
  retailer_id uuid references public.retailers(id) on delete set null,
  product_name text not null,
  category text,
  quantity integer,
  created_at timestamptz default now()
);

-- Affiliates
create table if not exists public.affiliates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  name text not null,
  email text not null,
  commission_rate numeric not null default 0.02,
  total_earnings numeric not null default 0,
  total_paid numeric not null default 0,
  total_clicks integer not null default 0,
  total_referrals integer not null default 0,
  status text not null default 'pending'
    check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz default now()
);

-- Referrals
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  referred_user_id uuid references auth.users(id) on delete set null,
  order_total numeric not null check (order_total >= 0),
  commission numeric not null check (commission >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'rejected')),
  created_at timestamptz default now()
);

-- ============================================
-- 3. INDEXES
-- ============================================
create index if not exists idx_sales_reps_active on public.sales_reps(is_active) where is_active = true;
create index if not exists idx_wholesalers_sales_rep on public.wholesalers(sales_rep_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_wholesaler on public.products(wholesaler_id);
create index if not exists idx_products_trending on public.products(is_trending) where is_trending = true;
create index if not exists idx_products_flash_deal on public.products(is_flash_deal) where is_flash_deal = true;
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_retailer on public.orders(retailer_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_affiliates_code on public.affiliates(code);
create index if not exists idx_affiliates_user on public.affiliates(user_id);
create index if not exists idx_referrals_affiliate on public.referrals(affiliate_id);

-- ============================================
-- 4. AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.sales_reps enable row level security;
alter table public.wholesalers enable row level security;
alter table public.products enable row level security;
alter table public.retailers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.demand_requests enable row level security;
alter table public.affiliates enable row level security;
alter table public.referrals enable row level security;

-- Sales Reps: anyone can read (retailers need rep info), authenticated can manage
create policy "Sales reps are viewable by everyone"
  on public.sales_reps for select using (true);

create policy "Authenticated users can manage sales reps"
  on public.sales_reps for all using (auth.role() = 'authenticated');

-- Products: anyone can read, only authenticated can insert/update
create policy "Products are viewable by everyone"
  on public.products for select using (true);

create policy "Authenticated users can manage products"
  on public.products for all using (auth.role() = 'authenticated');

-- Wholesalers: anyone can read
create policy "Wholesalers are viewable by everyone"
  on public.wholesalers for select using (true);

create policy "Authenticated users can manage wholesalers"
  on public.wholesalers for all using (auth.role() = 'authenticated');

-- Orders: users see their own, authenticated can manage all
create policy "Orders viewable by authenticated"
  on public.orders for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage orders"
  on public.orders for all using (auth.role() = 'authenticated');

-- Order Items: authenticated access
create policy "Order items viewable by authenticated"
  on public.order_items for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage order items"
  on public.order_items for all using (auth.role() = 'authenticated');

-- Retailers: authenticated access
create policy "Retailers viewable by authenticated"
  on public.retailers for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage retailers"
  on public.retailers for all using (auth.role() = 'authenticated');

-- Demand Requests
create policy "Demand requests viewable by authenticated"
  on public.demand_requests for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage demand requests"
  on public.demand_requests for all using (auth.role() = 'authenticated');

-- Affiliates: users see own, authenticated can manage
create policy "Affiliates viewable by owner"
  on public.affiliates for select using (auth.uid() = user_id);

create policy "Authenticated users can manage affiliates"
  on public.affiliates for all using (auth.role() = 'authenticated');

-- Referrals
create policy "Referrals viewable by affiliate owner"
  on public.referrals for select using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

create policy "Authenticated users can manage referrals"
  on public.referrals for all using (auth.role() = 'authenticated');

-- ============================================
-- 6. STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Allow public read access to product images
create policy "Product images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Allow authenticated users to upload/manage product images
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Authenticated users can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Authenticated users can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ============================================
-- 7. SEED DATA (sample wholesalers)
-- ============================================
-- Seed sales reps
insert into public.sales_reps (id, name, phone, whatsapp_phone, email, bio) values
  ('00000000-0000-0000-0000-000000000001', 'Amina Hassan', '+254712345001', '254712345001', 'amina@stocklink.co', 'Nairobi region specialist. 5+ years in wholesale distribution.'),
  ('00000000-0000-0000-0000-000000000002', 'Brian Kipchoge', '+254712345002', '254712345002', 'brian@stocklink.co', 'Coast & Mombasa rep. Expert in bulk food supplies.'),
  ('00000000-0000-0000-0000-000000000003', 'Grace Akinyi', '+254712345003', '254712345003', 'grace@stocklink.co', 'Western Kenya rep. Covers Kisumu and surrounding areas.')
on conflict do nothing;

-- Seed wholesalers (with sales rep assignments)
insert into public.wholesalers (name, location, phone, sales_rep_id) values
  ('Nairobi Premium Supplies', 'Industrial Area, Nairobi', '+254700111111', '00000000-0000-0000-0000-000000000001'),
  ('Mombasa Coast Trading', 'Changamwe, Mombasa', '+254700222222', '00000000-0000-0000-0000-000000000002'),
  ('Kisumu Lake Distributors', 'Kibuye, Kisumu', '+254700333333', '00000000-0000-0000-0000-000000000003')
on conflict do nothing;
