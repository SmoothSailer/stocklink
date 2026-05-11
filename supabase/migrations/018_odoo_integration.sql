-- ============================================================
-- Odoo ERP Integration: Cross-reference columns + sync log
-- ============================================================

-- 1. Cross-reference ID columns for synced entities
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS odoo_product_id integer UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS odoo_template_id integer UNIQUE;
ALTER TABLE public.wholesalers ADD COLUMN IF NOT EXISTS odoo_partner_id integer UNIQUE;
ALTER TABLE public.manufacturers ADD COLUMN IF NOT EXISTS odoo_partner_id integer UNIQUE;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS odoo_partner_id integer UNIQUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS odoo_category_id integer UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS odoo_order_id integer UNIQUE;

-- 2. Sync log table for audit and debugging
CREATE TABLE IF NOT EXISTS public.odoo_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'order', 'stock', 'partner', 'payment', 'category')),
  entity_id uuid,
  odoo_id integer,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'skipped')),
  error_message text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_odoo_sync_log_entity ON public.odoo_sync_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_odoo_sync_log_created ON public.odoo_sync_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_odoo_sync_log_status ON public.odoo_sync_log (status) WHERE status = 'error';

-- 3. RLS for sync log (admin-only access)
ALTER TABLE public.odoo_sync_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin users can read sync logs
CREATE POLICY "Admins can read sync logs"
  ON public.odoo_sync_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role (used by API routes) can insert sync logs
CREATE POLICY "Service role can manage sync logs"
  ON public.odoo_sync_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
