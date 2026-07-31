/*
# Saved customer addresses

## Overview
Lets a customer save labeled addresses (Home 1, Home 2, Work, ...) with
verified coordinates captured once via a map pin. Checkout can then pick
a saved address directly with no re-verification needed, since the
coordinates were already confirmed when the address was saved.

## Columns
- id, user_id (FK -> auth.users), label, address_text, latitude,
  longitude, created_at, updated_at

## Security
- A customer can only see/add/edit/delete their own saved addresses.
*/

CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  address_text text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_addresses" ON customer_addresses;
CREATE POLICY "select_own_addresses" ON customer_addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_addresses" ON customer_addresses;
CREATE POLICY "insert_own_addresses" ON customer_addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_addresses" ON customer_addresses;
CREATE POLICY "update_own_addresses" ON customer_addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_addresses" ON customer_addresses;
CREATE POLICY "delete_own_addresses" ON customer_addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
