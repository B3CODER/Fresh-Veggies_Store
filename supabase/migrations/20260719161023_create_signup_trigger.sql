/*
# Auto-create profile on signup

Trigger fires AFTER INSERT on auth.users, inserts a customer profile row.
*/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'customer', COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO profiles (id, role, full_name)
SELECT id, 'admin', 'Store Owner' FROM auth.users WHERE email = 'admin@freshveggies.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
