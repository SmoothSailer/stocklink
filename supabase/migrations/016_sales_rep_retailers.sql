-- ============================================================
-- Sales Rep Retailer Management: Assignment, Leads, Activities
-- ============================================================

-- 1. Add sales_rep_id to retailers
ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_retailers_sales_rep ON public.retailers(sales_rep_id);

-- RLS: Sales reps can read their assigned retailers
DROP POLICY IF EXISTS "Sales reps can read assigned retailers" ON public.retailers;
CREATE POLICY "Sales reps can read assigned retailers"
  ON public.retailers FOR SELECT
  USING (
    sales_rep_id IN (
      SELECT id FROM public.sales_reps WHERE user_id = auth.uid()
    )
  );

-- RLS: Sales reps can insert retailers (onboarding)
DROP POLICY IF EXISTS "Sales reps can onboard retailers" ON public.retailers;
CREATE POLICY "Sales reps can onboard retailers"
  ON public.retailers FOR INSERT
  WITH CHECK (
    sales_rep_id IN (
      SELECT id FROM public.sales_reps WHERE user_id = auth.uid()
    )
  );

-- 2. Leads table for pipeline management
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_name text,
  phone text NOT NULL,
  location text,
  notes text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'interested', 'converted', 'lost')),
  source text DEFAULT 'field_visit'
    CHECK (source IN ('field_visit', 'referral', 'whatsapp', 'walk_in', 'other')),
  converted_retailer_id uuid REFERENCES public.retailers(id) ON DELETE SET NULL,
  follow_up_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_sales_rep ON public.leads(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON public.leads(follow_up_date) WHERE follow_up_date IS NOT NULL;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales reps can manage own leads"
  ON public.leads FOR ALL
  USING (
    sales_rep_id IN (
      SELECT id FROM public.sales_reps WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    sales_rep_id IN (
      SELECT id FROM public.sales_reps WHERE user_id = auth.uid()
    )
  );

-- 3. Rep activities / visit log table
CREATE TABLE IF NOT EXISTS public.rep_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('visit', 'call', 'whatsapp', 'order_follow_up', 'payment_collection', 'onboarding', 'note')),
  notes text,
  outcome text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_activities_sales_rep ON public.rep_activities(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_rep_activities_retailer ON public.rep_activities(retailer_id) WHERE retailer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rep_activities_created ON public.rep_activities(created_at DESC);

ALTER TABLE public.rep_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales reps can manage own activities"
  ON public.rep_activities FOR ALL
  USING (
    sales_rep_id IN (
      SELECT id FROM public.sales_reps WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    sales_rep_id IN (
      SELECT id FROM public.sales_reps WHERE user_id = auth.uid()
    )
  );

-- 4. Function to get retailers likely running low on products
-- Based on their average order interval vs days since last order
CREATE OR REPLACE FUNCTION get_restock_alerts(p_sales_rep_id uuid)
RETURNS TABLE (
  retailer_id uuid,
  retailer_name text,
  retailer_phone text,
  retailer_location text,
  product_id uuid,
  product_name text,
  avg_interval_days numeric,
  days_since_last numeric,
  urgency numeric
) AS $$
  WITH retailer_product_orders AS (
    -- Get each retailer's order dates per product
    SELECT
      r.id AS retailer_id,
      r.name AS retailer_name,
      r.phone AS retailer_phone,
      r.location AS retailer_location,
      oi.product_id,
      p.name AS product_name,
      o.created_at::date AS order_date
    FROM retailers r
    JOIN orders o ON o.retailer_id = r.id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE r.sales_rep_id = p_sales_rep_id
      AND o.status != 'cancelled'
  ),
  order_intervals AS (
    -- Calculate interval between consecutive orders per retailer-product pair
    SELECT
      retailer_id,
      retailer_name,
      retailer_phone,
      retailer_location,
      product_id,
      product_name,
      order_date,
      order_date - LAG(order_date) OVER (
        PARTITION BY retailer_id, product_id ORDER BY order_date
      ) AS interval_days
    FROM retailer_product_orders
  ),
  avg_intervals AS (
    -- Compute average interval per retailer-product (need at least 2 orders)
    SELECT
      retailer_id,
      retailer_name,
      retailer_phone,
      retailer_location,
      product_id,
      product_name,
      AVG(interval_days) AS avg_interval_days,
      MAX(order_date) AS last_order_date
    FROM order_intervals
    WHERE interval_days IS NOT NULL
    GROUP BY retailer_id, retailer_name, retailer_phone, retailer_location, product_id, product_name
    HAVING COUNT(*) >= 1
  )
  SELECT
    ai.retailer_id,
    ai.retailer_name,
    ai.retailer_phone,
    ai.retailer_location,
    ai.product_id,
    ai.product_name,
    ROUND(ai.avg_interval_days, 1) AS avg_interval_days,
    (CURRENT_DATE - ai.last_order_date)::numeric AS days_since_last,
    ROUND(((CURRENT_DATE - ai.last_order_date)::numeric / NULLIF(ai.avg_interval_days, 0)), 2) AS urgency
  FROM avg_intervals ai
  WHERE (CURRENT_DATE - ai.last_order_date)::numeric > ai.avg_interval_days * 1.2
  ORDER BY urgency DESC
  LIMIT 50;
$$ LANGUAGE sql STABLE;
