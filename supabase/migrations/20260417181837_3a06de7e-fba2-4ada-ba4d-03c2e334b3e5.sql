
-- Remove anon SELECT on the base table entirely
DROP POLICY IF EXISTS "Public can view classes" ON public.group_classes;
REVOKE ALL ON public.group_classes FROM anon;

-- Drop the view (it required underlying SELECT in invoker mode)
DROP VIEW IF EXISTS public.group_classes_public;

-- Replace with a SECURITY DEFINER function that returns safe columns only.
-- This is the canonical way to publicly expose a subset of a private table.
CREATE OR REPLACE FUNCTION public.list_public_classes(_from date DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  program text,
  instructor text,
  description text,
  class_date date,
  start_time time,
  end_time time,
  max_capacity integer,
  recurrence_group_id uuid,
  is_recurring boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, program, instructor, description,
         class_date, start_time, end_time, max_capacity,
         recurrence_group_id, is_recurring
  FROM public.group_classes
  WHERE (_from IS NULL OR class_date >= _from)
  ORDER BY class_date, start_time
$$;

GRANT EXECUTE ON FUNCTION public.list_public_classes(date) TO anon, authenticated;

-- Also create a "by id" lookup for single-class detail (used by check-in flow)
CREATE OR REPLACE FUNCTION public.get_public_class(_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  program text,
  instructor text,
  description text,
  class_date date,
  start_time time,
  end_time time,
  max_capacity integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, program, instructor, description,
         class_date, start_time, end_time, max_capacity
  FROM public.group_classes
  WHERE id = _id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_class(uuid) TO anon, authenticated;
