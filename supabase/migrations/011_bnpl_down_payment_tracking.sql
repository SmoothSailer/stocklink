-- Track when the 30% down payment has been collected
ALTER TABLE bnpl_plans
  ADD COLUMN IF NOT EXISTS down_payment_paid_at timestamptz DEFAULT NULL;
