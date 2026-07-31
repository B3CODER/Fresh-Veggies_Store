/*
# Add delivery radius enforcement toggle

## Overview
Adds a boolean flag to `settings` so the admin can turn delivery-radius
enforcement on or off from the dashboard.

- When ON: customers must share their location at checkout, and orders
  placed from outside `delivery_radius_km` are blocked with a
  "not serving this location" message.
- When OFF: the distance check is skipped entirely and all orders are
  accepted regardless of location.

## Changes
- `settings.enforce_delivery_radius` boolean, defaults to true (preserves
  the existing behavior for stores that already configured a radius).
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS enforce_delivery_radius boolean NOT NULL DEFAULT true;
