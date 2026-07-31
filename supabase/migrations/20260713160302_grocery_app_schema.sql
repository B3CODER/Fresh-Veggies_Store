/*
# Grocery Ordering App — Full Schema

## Overview
Creates all tables for a local grocery ordering web application with two roles: admin (shop owner) and customer (public, no login required).

## Tables Created
1. `settings` — Store configuration: name, banner, location, delivery radius, WhatsApp number, opening hours.
2. `vegetables` — Product catalog managed by admin; customers browse in real time.
3. `orders` — Customer orders with location data and status tracking.
4. `order_items` — Line items linked to each order.

## Security Notes
- Customers do NOT need a login → all public tables use `TO anon, authenticated` policies.
- Admin operations (insert/update/delete on vegetables, update on orders, settings) are protected by `TO authenticated` policies (admin logs in via Supabase Auth).
- Customers can SELECT vegetables, settings, and their own orders (matched by `id` passed from the frontend).
- `orders` and `order_items` allow anon INSERT (placing an order) but only authenticated users (admin) can UPDATE orders.
- `settings` allows anon SELECT so the banner/store info shows publicly; only authenticated admin can INSERT/UPDATE.

## Columns
### settings
- id, store_name, store_address, phone_number, whatsapp_number, delivery_radius_km, latitude, longitude, opening_time, closing_time, banner_url, created_at, updated_at

### vegetables
- id, name, price, unit (kg/gram/piece/dozen), quantity_available, is_available, image_url, created_at, updated_at

### orders
- id, customer_name, customer_phone, delivery_address, latitude, longitude, total_amount, status (pending/accepted/rejected/preparing/completed), notes, created_at, updated_at

### order_items
- id, order_id (FK → orders), vegetable_id (FK → vegetables), vegetable_name (snapshot), vegetable_unit (snapshot), price_at_order (snapshot), quantity, subtotal
*/

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Fresh Veggies',
  store_address text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  delivery_radius_km numeric NOT NULL DEFAULT 5,
  latitude numeric,
  longitude numeric,
  opening_time text NOT NULL DEFAULT '08:00',
  closing_time text NOT NULL DEFAULT '20:00',
  banner_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_settings" ON settings;
CREATE POLICY "public_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON settings;
CREATE POLICY "admin_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_settings" ON settings;
CREATE POLICY "admin_delete_settings" ON settings FOR DELETE
  TO authenticated USING (true);

-- Seed a default settings row if none exists
INSERT INTO settings (store_name, store_address, phone_number, whatsapp_number, delivery_radius_km)
SELECT 'Fresh Veggies Store', '', '', '', 5
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- ============================================================
-- VEGETABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vegetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  quantity_available numeric,
  is_available boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_vegetables" ON vegetables;
CREATE POLICY "public_select_vegetables" ON vegetables FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_vegetables" ON vegetables;
CREATE POLICY "admin_insert_vegetables" ON vegetables FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_vegetables" ON vegetables;
CREATE POLICY "admin_update_vegetables" ON vegetables FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_vegetables" ON vegetables;
CREATE POLICY "admin_delete_vegetables" ON vegetables FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  latitude numeric,
  longitude numeric,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'preparing', 'completed')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can place orders (anon INSERT) and view any order by id (via the status page)
DROP POLICY IF EXISTS "public_select_orders" ON orders;
CREATE POLICY "public_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only admin can update order status
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vegetable_id uuid REFERENCES vegetables(id) ON DELETE SET NULL,
  vegetable_name text NOT NULL,
  vegetable_unit text NOT NULL,
  price_at_order numeric NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_order_items" ON order_items;
CREATE POLICY "public_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_order_items" ON order_items;
CREATE POLICY "public_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_order_items" ON order_items;
CREATE POLICY "admin_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_order_items" ON order_items;
CREATE POLICY "admin_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vegetables_is_available ON vegetables(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_vegetables_updated_at ON vegetables;
CREATE TRIGGER trg_vegetables_updated_at
  BEFORE UPDATE ON vegetables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
