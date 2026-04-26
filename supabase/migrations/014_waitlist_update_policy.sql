-- Add missing UPDATE policy for product_waitlist
-- Required for upsert (update quantity/notes) to work with RLS

DROP POLICY IF EXISTS "Retailers can update own waitlist entries" ON product_waitlist;
CREATE POLICY "Retailers can update own waitlist entries"
  ON product_waitlist FOR UPDATE
  USING (retailer_id IN (
    SELECT id FROM retailers WHERE user_id = auth.uid()
  ))
  WITH CHECK (retailer_id IN (
    SELECT id FROM retailers WHERE user_id = auth.uid()
  ));
