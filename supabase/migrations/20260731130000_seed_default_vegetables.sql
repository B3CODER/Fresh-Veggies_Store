/*
# Seed starter vegetables

Adds a small starter catalog so a fresh store isn't empty on first load.
Only runs if `vegetables` is currently empty, so it's safe to re-run and
won't duplicate rows or touch anything an admin has already added.
*/

INSERT INTO vegetables (name, price, unit, quantity_available, is_available, image_url)
SELECT * FROM (VALUES
  ('Tomato', 40, 'kg', 50, true, 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Potato', 30, 'kg', 80, true, 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Onion', 35, 'kg', 70, true, 'https://images.pexels.com/photos/175236/pexels-photo-175236.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Carrot', 50, 'kg', 40, true, 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Spinach', 25, 'kg', 30, true, 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Cauliflower', 35, 'piece', 25, true, ''),
  ('Cabbage', 30, 'piece', 25, true, ''),
  ('Brinjal', 40, 'kg', 35, true, ''),
  ('Cucumber', 30, 'kg', 40, true, ''),
  ('Capsicum', 60, 'kg', 20, true, ''),
  ('Green Chilli', 80, 'kg', 15, true, ''),
  ('Ginger', 120, 'kg', 15, true, ''),
  ('Garlic', 150, 'kg', 15, true, ''),
  ('Coriander', 10, 'piece', 40, true, ''),
  ('Lemon', 5, 'piece', 60, true, '')
) AS v(name, price, unit, quantity_available, is_available, image_url)
WHERE NOT EXISTS (SELECT 1 FROM vegetables LIMIT 1);
