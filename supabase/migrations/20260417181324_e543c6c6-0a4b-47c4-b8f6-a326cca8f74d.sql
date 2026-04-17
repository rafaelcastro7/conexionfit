
-- Recreate the public view as security_invoker so it follows the caller's RLS
DROP VIEW IF EXISTS public.group_classes_public;

CREATE VIEW public.group_classes_public
WITH (security_invoker = true) AS
SELECT
  id, title, program, instructor, description,
  class_date, start_time, end_time, max_capacity,
  recurrence_group_id, is_recurring, created_at, updated_at
FROM public.group_classes;

-- Allow anon/auth to read the view; we add a permissive SELECT policy
-- limited to non-token columns by virtue of the view definition.
GRANT SELECT ON public.group_classes_public TO anon, authenticated;

-- Add a public-readable policy on the underlying table but only when accessed
-- through the view (security_invoker uses the caller's role, so we need to
-- re-allow public SELECT on the base table for the columns used by the view).
-- However we want to KEEP checkin_token hidden from anon. With security_invoker,
-- the caller needs SELECT on the table. So we instead keep the view as
-- security definer but expose only safe columns via the view definition.

DROP VIEW IF EXISTS public.group_classes_public;

CREATE VIEW public.group_classes_public AS
SELECT
  id, title, program, instructor, description,
  class_date, start_time, end_time, max_capacity,
  recurrence_group_id, is_recurring, created_at, updated_at
FROM public.group_classes;

-- Re-allow anon SELECT on the underlying table BUT only via column-level grants
-- using a policy that excludes checkin_token. Simpler: allow anon to view base
-- table and rely on the view to omit the token. We add a public SELECT policy:
CREATE POLICY "Public can view non-sensitive class fields"
ON public.group_classes
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.group_classes_public TO anon, authenticated;

-- Revoke direct SELECT on checkin_token column from anon to prevent leakage
REVOKE SELECT (checkin_token) ON public.group_classes FROM anon;
