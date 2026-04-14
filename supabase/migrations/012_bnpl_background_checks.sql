-- ============================================================
-- BNPL Background Checks: Retailer KYC, Credit Limits, Plan Approval
-- ============================================================

-- 1. Retailer verification & credit limit fields
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS id_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_reg_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_by uuid DEFAULT NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS credit_limit numeric NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  ADD COLUMN IF NOT EXISTS bnpl_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_notes text DEFAULT NULL;

-- 2. BNPL plan approval status
ALTER TABLE bnpl_plans
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'completed', 'defaulted')),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_by uuid DEFAULT NULL REFERENCES auth.users(id);

-- 3. Function to compute a retailer's outstanding BNPL exposure
-- (sum of unpaid balances across all active BNPL plans)
CREATE OR REPLACE FUNCTION get_retailer_bnpl_exposure(p_retailer_id uuid)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(bp.total_with_markup - COALESCE(o.amount_paid, 0)), 0)
  FROM bnpl_plans bp
  JOIN orders o ON o.id = bp.order_id
  WHERE o.retailer_id = p_retailer_id
    AND bp.status IN ('pending', 'active')
$$ LANGUAGE sql STABLE;

-- 4. Function to advance installment statuses (upcoming -> due, due -> overdue)
-- Designed to be called by pg_cron or an edge function daily
CREATE OR REPLACE FUNCTION advance_installment_statuses()
RETURNS integer AS $$
DECLARE
  updated_count integer := 0;
  rows_affected integer;
BEGIN
  -- Mark "upcoming" installments as "due" if due_date <= today
  UPDATE bnpl_installments
  SET status = 'due'
  WHERE status = 'upcoming'
    AND due_date <= CURRENT_DATE;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  updated_count := updated_count + rows_affected;

  -- Mark "due" installments as "overdue" if due_date < today (past due)
  UPDATE bnpl_installments
  SET status = 'overdue'
  WHERE status = 'due'
    AND due_date < CURRENT_DATE;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  updated_count := updated_count + rows_affected;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Try to set up pg_cron (will silently fail if extension not available)
-- On Supabase, pg_cron is available on Pro plans
DO $$
BEGIN
  -- Run daily at midnight UTC
  PERFORM cron.schedule(
    'advance-bnpl-installments',
    '0 0 * * *',
    'SELECT advance_installment_statuses()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — installment status advancement must be triggered manually or via Edge Function';
END;
$$;
