-- Migration: hold auto-expiry (notify next in queue)
-- 1. allow the 'expired' status on holds
ALTER TABLE holds DROP CONSTRAINT IF EXISTS holds_status_check;
ALTER TABLE holds ADD CONSTRAINT holds_status_check
  CHECK (status IN ('waiting', 'notified', 'fulfilled', 'cancelled', 'expired'));

-- 2. pickup window: days a notified member has to collect the book
INSERT INTO system_config (key, value, description)
VALUES ('hold_expiry_days', '3', 'Days a notified member has to collect a held book before the hold expires and passes to the next person')
ON CONFLICT (key) DO NOTHING;
