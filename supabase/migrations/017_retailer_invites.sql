-- ============================================================
-- Retailer Invites: Track sales rep invitations before onboarding
-- ============================================================

-- 1. Invites table — holds invite data until the retailer signs up
CREATE TABLE IF NOT EXISTS public.retailer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_name text,
  phone text NOT NULL,
  email text,
  location text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_retailer_invites_sales_rep ON public.retailer_invites(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_retailer_invites_status ON public.retailer_invites(status);
CREATE INDEX IF NOT EXISTS idx_retailer_invites_phone ON public.retailer_invites(phone);
CREATE INDEX IF NOT EXISTS idx_retailer_invites_email ON public.retailer_invites(email) WHERE email IS NOT NULL;

ALTER TABLE public.retailer_invites ENABLE ROW LEVEL SECURITY;

-- Sales reps can manage their own invites
CREATE POLICY "Sales reps can manage own invites"
  ON public.retailer_invites FOR ALL
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

-- Allow public read of invites by id (for signup page to look up invite details)
CREATE POLICY "Anyone can read invite by id"
  ON public.retailer_invites FOR SELECT
  USING (true);

-- 2. Migrate existing retailers with no user_id (created by sales reps but never signed up) into invites
INSERT INTO public.retailer_invites (sales_rep_id, name, business_name, phone, email, location, status, retailer_id, created_at, accepted_at)
SELECT
  r.sales_rep_id,
  r.name,
  r.business_name,
  r.phone,
  r.email,
  r.location,
  CASE WHEN r.user_id IS NOT NULL THEN 'accepted' ELSE 'pending' END,
  CASE WHEN r.user_id IS NOT NULL THEN r.id ELSE NULL END,
  r.created_at,
  CASE WHEN r.user_id IS NOT NULL THEN r.created_at ELSE NULL END
FROM public.retailers r
WHERE r.sales_rep_id IS NOT NULL;
