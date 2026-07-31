/*
# Fix function security findings

## 1. update_updated_at() — search_path mutable
The trigger function `public.update_updated_at()` was created without a
`SET search_path` clause, so its search_path is role-mutable. A caller
could shadow objects the function references. Recreate it with an
explicit `SET search_path = public` so the path is locked.

## 2. handle_new_user() — executable by anon and authenticated
`public.handle_new_user()` is a SECURITY DEFINER trigger function that
auto-creates a profile row after signup. It is only meant to be invoked
by the `on_auth_user_created` trigger on `auth.users`, never called
directly over the REST API. By default every role has EXECUTE, so
`anon` and `authenticated` could invoke it via `/rest/v1/rpc/handle_new_user`.
Revoke EXECUTE from PUBLIC, anon, and authenticated. The trigger still
fires because trigger execution uses the table owner's privileges, not
the caller's EXECUTE grant.

## Notes
- No data is modified or deleted.
- No tables, columns, or policies are changed.
- Both functions are recreated idempotently with CREATE OR REPLACE.
*/

-- 1. Lock search_path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Revoke direct execution of the signup trigger function from all web-facing roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
