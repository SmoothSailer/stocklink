-- International manufacturer support & Sambaza cargo shipments
-- Issue #18: feat: International manufacturer support with Sambaza cargo shipment tracking and landed cost

-- ── Phase 1: Extend manufacturers for international support ─────────────

ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS country text DEFAULT 'KE';
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'KE';
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS is_international boolean DEFAULT false;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'KES';
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS default_incoterms text;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS default_port_of_origin text;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS lead_time_days integer;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS bank_details jsonb;

CREATE INDEX IF NOT EXISTS idx_manufacturers_international
  ON public.manufacturers(is_international) WHERE is_international = true;

-- ── Phase 2: Sambaza shipments ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sambaza_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number text UNIQUE NOT NULL,
  manufacturer_id uuid REFERENCES public.manufacturers(id) ON DELETE SET NULL,

  -- Origin
  origin_country text NOT NULL,
  origin_port text,

  -- Destination
  destination_port text DEFAULT 'Mombasa',
  destination_warehouse text,

  -- Shipping details
  shipping_method text NOT NULL CHECK (shipping_method IN ('sea', 'air', 'road')),
  container_type text,
  container_number text,
  bill_of_lading text,

  -- Dates
  estimated_departure date,
  actual_departure date,
  estimated_arrival date,
  actual_arrival date,
  customs_clearance_date date,
  warehouse_receipt_date date,

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'booked',
    'in_production',
    'ready_for_shipping',
    'in_transit',
    'at_port',
    'customs_clearance',
    'inland_transit',
    'delivered',
    'cancelled'
  )),

  -- Costs (in original currency)
  currency text NOT NULL DEFAULT 'USD',
  freight_cost decimal(12,2) DEFAULT 0,
  insurance_cost decimal(12,2) DEFAULT 0,
  customs_duty decimal(12,2) DEFAULT 0,
  excise_duty decimal(12,2) DEFAULT 0,
  vat decimal(12,2) DEFAULT 0,
  port_charges decimal(12,2) DEFAULT 0,
  inland_transport decimal(12,2) DEFAULT 0,
  other_charges decimal(12,2) DEFAULT 0,
  total_cost_foreign decimal(12,2) DEFAULT 0,
  exchange_rate decimal(10,4),
  total_cost_kes decimal(12,2) DEFAULT 0,

  -- Documents
  documents jsonb DEFAULT '[]',

  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shipment items
CREATE TABLE IF NOT EXISTS public.sambaza_shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.sambaza_shipments(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer NOT NULL,
  unit text,
  unit_cost_foreign decimal(12,2),
  total_cost_foreign decimal(12,2),
  landed_cost_per_unit_kes decimal(12,2),
  hs_code text,
  country_of_origin text,
  created_at timestamptz DEFAULT now()
);

-- Shipment status history
CREATE TABLE IF NOT EXISTS public.sambaza_shipment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.sambaza_shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  notes text,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Exchange rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL DEFAULT 'KES',
  rate decimal(10,4) NOT NULL,
  source text,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency, effective_date)
);

-- ── Phase 3: Product cost tracking ──────────────────────────────────────

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS last_landed_cost_kes decimal(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_currency text DEFAULT 'KES';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_cost_foreign decimal(12,2);

-- ── Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_shipments_manufacturer ON public.sambaza_shipments(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.sambaza_shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON public.sambaza_shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product ON public.sambaza_shipment_items(product_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates(from_currency, to_currency, effective_date DESC);

-- ── RLS Policies ────────────────────────────────────────────────────────

ALTER TABLE public.sambaza_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sambaza_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sambaza_shipment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Shipments: authenticated users can read and manage
CREATE POLICY "Authenticated users can read shipments"
  ON public.sambaza_shipments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage shipments"
  ON public.sambaza_shipments FOR ALL TO authenticated USING (true);

-- Shipment items: authenticated users can read and manage
CREATE POLICY "Authenticated users can read shipment items"
  ON public.sambaza_shipment_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage shipment items"
  ON public.sambaza_shipment_items FOR ALL TO authenticated USING (true);

-- Shipment status history: authenticated users can read and manage
CREATE POLICY "Authenticated users can read shipment status history"
  ON public.sambaza_shipment_status_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage shipment status history"
  ON public.sambaza_shipment_status_history FOR ALL TO authenticated USING (true);

-- Exchange rates: anyone can read, authenticated can manage
CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage exchange rates"
  ON public.exchange_rates FOR ALL TO authenticated USING (true);

-- ── Updated_at trigger for shipments ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_shipments_updated_at ON public.sambaza_shipments;
CREATE TRIGGER set_shipments_updated_at
  BEFORE UPDATE ON public.sambaza_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
