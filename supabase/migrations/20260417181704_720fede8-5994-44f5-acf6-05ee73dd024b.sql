
-- 1. Remove anon SELECT from base table; anon must use the public view
DROP POLICY IF EXISTS "Public can view classes" ON public.group_classes;
REVOKE ALL ON public.group_classes FROM anon;
-- The view (security_invoker = true) needs underlying SELECT permission too.
-- Switch the view to a SECURITY DEFINER function-style approach via a wrapper.

DROP VIEW IF EXISTS public.group_classes_public;

CREATE VIEW public.group_classes_public
WITH (security_invoker = false) AS
SELECT
  id, title, program, instructor, description,
  class_date, start_time, end_time, max_capacity,
  recurrence_group_id, is_recurring, created_at, updated_at
FROM public.group_classes;

-- Use security_definer view so anon doesn't need SELECT on base table
ALTER VIEW public.group_classes_public SET (security_invoker = false);
GRANT SELECT ON public.group_classes_public TO anon, authenticated;

-- 2. Lock down user_roles INSERT explicitly
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
