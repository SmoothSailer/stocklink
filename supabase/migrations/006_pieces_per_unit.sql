-- Add pieces_per_unit to products and product_unit_options
-- e.g. "1 box = 12 pieces", "1 carton = 24 jars"

alter table public.products
  add column if not exists pieces_per_unit integer;

alter table public.product_unit_options
  add column if not exists pieces_per_unit integer;
