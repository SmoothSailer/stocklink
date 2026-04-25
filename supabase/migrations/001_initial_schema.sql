-- StockLink Database Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- ============================================
-- 2. TABLES
-- ============================================

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text not null default '📦',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Product Units
create table if not exists public.product_units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  plural_name text not null,
  abbreviation text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Sales Representatives
create table if not exists public.sales_reps (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  phone text,
  sales_rep_id uuid references public.sales_reps(id) on delete set null,
  created_at timestamptz default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  business_name text,
  phone text not null,
  email text,
  location text,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total_price numeric not null check (total_price >= 0)
);

-- Demand Requests
create table if not exists public.demand_requests (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid references public.retailers(id) on delete set null,
  product_name text not null,
  category text,
  quantity integer,
  created_at timestamptz default now()
);

-- Affiliates
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
create index if not exists idx_categories_active on public.categories(is_active) where is_active = true;
create index if not exists idx_categories_sort on public.categories(sort_order);
create index if not exists idx_product_units_active on public.product_units(is_active) where is_active = true;
create index if not exists idx_product_units_sort on public.product_units(sort_order);
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

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.categories enable row level security;
alter table public.product_units enable row level security;
alter table public.sales_reps enable row level security;
alter table public.wholesalers enable row level security;
alter table public.products enable row level security;
alter table public.retailers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.demand_requests enable row level security;
alter table public.affiliates enable row level security;
alter table public.referrals enable row level security;

-- Categories: anyone can read, authenticated can manage
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

drop policy if exists "Authenticated users can manage categories" on public.categories;
create policy "Authenticated users can manage categories"
  on public.categories for all using (auth.role() = 'authenticated');

-- Product Units: anyone can read, authenticated can manage
drop policy if exists "Product units are viewable by everyone" on public.product_units;
create policy "Product units are viewable by everyone"
  on public.product_units for select using (true);

drop policy if exists "Authenticated users can manage product units" on public.product_units;
create policy "Authenticated users can manage product units"
  on public.product_units for all using (auth.role() = 'authenticated');

-- Sales Reps: anyone can read (retailers need rep info), authenticated can manage
drop policy if exists "Sales reps are viewable by everyone" on public.sales_reps;
create policy "Sales reps are viewable by everyone"
  on public.sales_reps for select using (true);

drop policy if exists "Authenticated users can manage sales reps" on public.sales_reps;
create policy "Authenticated users can manage sales reps"
  on public.sales_reps for all using (auth.role() = 'authenticated');

-- Products: anyone can read, only authenticated can insert/update
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products for select using (true);

drop policy if exists "Authenticated users can manage products" on public.products;
create policy "Authenticated users can manage products"
  on public.products for all using (auth.role() = 'authenticated');

-- Wholesalers: anyone can read
drop policy if exists "Wholesalers are viewable by everyone" on public.wholesalers;
create policy "Wholesalers are viewable by everyone"
  on public.wholesalers for select using (true);

drop policy if exists "Authenticated users can manage wholesalers" on public.wholesalers;
create policy "Authenticated users can manage wholesalers"
  on public.wholesalers for all using (auth.role() = 'authenticated');

-- Orders: users see their own, authenticated can manage all
drop policy if exists "Orders viewable by authenticated" on public.orders;
create policy "Orders viewable by authenticated"
  on public.orders for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage orders" on public.orders;
create policy "Authenticated users can manage orders"
  on public.orders for all using (auth.role() = 'authenticated');

-- Order Items: authenticated access
drop policy if exists "Order items viewable by authenticated" on public.order_items;
create policy "Order items viewable by authenticated"
  on public.order_items for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage order items" on public.order_items;
create policy "Authenticated users can manage order items"
  on public.order_items for all using (auth.role() = 'authenticated');

-- Retailers: authenticated access
drop policy if exists "Retailers viewable by authenticated" on public.retailers;
create policy "Retailers viewable by authenticated"
  on public.retailers for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage retailers" on public.retailers;
create policy "Authenticated users can manage retailers"
  on public.retailers for all using (auth.role() = 'authenticated');

-- Demand Requests
drop policy if exists "Demand requests viewable by authenticated" on public.demand_requests;
create policy "Demand requests viewable by authenticated"
  on public.demand_requests for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage demand requests" on public.demand_requests;
create policy "Authenticated users can manage demand requests"
  on public.demand_requests for all using (auth.role() = 'authenticated');

-- Affiliates: users see own, authenticated can manage
drop policy if exists "Affiliates viewable by owner" on public.affiliates;
create policy "Affiliates viewable by owner"
  on public.affiliates for select using (auth.uid() = user_id);

drop policy if exists "Authenticated users can manage affiliates" on public.affiliates;
create policy "Authenticated users can manage affiliates"
  on public.affiliates for all using (auth.role() = 'authenticated');

-- Referrals
drop policy if exists "Referrals viewable by affiliate owner" on public.referrals;
create policy "Referrals viewable by affiliate owner"
  on public.referrals for select using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

drop policy if exists "Authenticated users can manage referrals" on public.referrals;
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

-- Drop old policies (handles both old space-named and new snake_case names)
drop policy if exists "Product images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;
drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_auth_insert" on storage.objects;
drop policy if exists "product_images_auth_update" on storage.objects;
drop policy if exists "product_images_auth_delete" on storage.objects;

-- Allow public read access to product images
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Allow authenticated users to upload/manage product images
create policy "product_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product_images_auth_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ============================================
-- 7. SEED DATA (sample wholesalers)
-- ============================================
-- Seed categories
insert into public.categories (name, slug, icon, sort_order) values
  ('Rice', 'rice', '🍚', 1),
  ('Oil', 'oil', '🫒', 2),
  ('Sugar', 'sugar', '🍬', 3),
  ('Flour', 'flour', '🌾', 4),
  ('LPG Gas', 'lpg', '🔥', 5),
  ('Beverages', 'beverages', '🥤', 6),
  ('Dairy', 'dairy', '🥛', 7),
  ('Cleaning', 'cleaning', '🧴', 8)
on conflict do nothing;

-- Seed product units
insert into public.product_units (name, slug, plural_name, abbreviation, sort_order) values
  ('Bag', 'bag', 'Bags', 'bag', 1),
  ('Carton', 'carton', 'Cartons', 'ctn', 2),
  ('Box', 'box', 'Boxes', 'box', 3),
  ('Crate', 'crate', 'Crates', 'crt', 4),
  ('Jerrycan', 'jerrycan', 'Jerrycans', 'jcn', 5),
  ('Cylinder', 'cylinder', 'Cylinders', 'cyl', 6),
  ('Piece', 'piece', 'Pieces', 'pc', 7),
  ('Dozen', 'dozen', 'Dozens', 'dz', 8),
  ('Bale', 'bale', 'Bales', 'bale', 9),
  ('Packet', 'packet', 'Packets', 'pkt', 10)
on conflict do nothing;

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
