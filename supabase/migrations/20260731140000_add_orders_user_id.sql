/*
# Add missing user_id column on orders

## Overview
Checkout inserts `user_id` and "My Orders" filters by it, but the original
schema never created this column — every order placement was failing.

## Changes
- `orders.user_id` uuid, references auth.users, nullable (kept null if the
  account is later deleted rather than losing the order record).
- Index on user_id since "My Orders" filters by it directly.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
