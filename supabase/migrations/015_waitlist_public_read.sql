-- Allow anyone to read waitlist entries (for showing "X retailers waiting" counts)
-- The existing policy only lets retailers see their own entries.
-- We add a broader SELECT policy so all users (including anonymous) can see counts.

DROP POLICY IF EXISTS "Anyone can view waitlist entries" ON product_waitlist;
CREATE POLICY "Anyone can view waitlist entries"
  ON product_waitlist FOR SELECT
  USING (true);
