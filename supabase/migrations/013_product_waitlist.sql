-- Migration: Add coming_soon flag to products and waitlist table
-- Products can be marked as "coming soon" so retailers can join a waiting list

-- Add coming_soon flag to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_coming_soon boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expected_arrival_date date;

-- Waitlist table: retailers express interest in coming-soon products
CREATE TABLE IF NOT EXISTS product_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  quantity_interested integer NOT NULL DEFAULT 1,
  notes text,
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Each retailer can only join the waitlist once per product
  UNIQUE (product_id, retailer_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_waitlist_product ON product_waitlist(product_id);
CREATE INDEX IF NOT EXISTS idx_product_waitlist_retailer ON product_waitlist(retailer_id);

-- RLS
ALTER TABLE product_waitlist ENABLE ROW LEVEL SECURITY;

-- Retailers can view their own waitlist entries
DROP POLICY IF EXISTS "Retailers can view own waitlist entries" ON product_waitlist;
CREATE POLICY "Retailers can view own waitlist entries"
  ON product_waitlist FOR SELECT
  USING (retailer_id IN (
    SELECT id FROM retailers WHERE user_id = auth.uid()
  ));

-- Retailers can insert their own waitlist entries
DROP POLICY IF EXISTS "Retailers can join waitlist" ON product_waitlist;
CREATE POLICY "Retailers can join waitlist"
  ON product_waitlist FOR INSERT
  WITH CHECK (retailer_id IN (
    SELECT id FROM retailers WHERE user_id = auth.uid()
  ));

-- Retailers can delete their own waitlist entries
DROP POLICY IF EXISTS "Retailers can leave waitlist" ON product_waitlist;
CREATE POLICY "Retailers can leave waitlist"
  ON product_waitlist FOR DELETE
  USING (retailer_id IN (
    SELECT id FROM retailers WHERE user_id = auth.uid()
  ));

-- Admins have full access via service role (no policy needed)
