
DROP VIEW IF EXISTS public.group_classes_public;

CREATE VIEW public.group_classes_public
WITH (security_invoker = true) AS
SELECT
  id, title, program, instructor, description,
  class_date, start_time, end_time, max_capacity,
  recurrence_group_id, is_recurring, created_at, updated_at
FROM public.group_classes;

GRANT SELECT ON public.group_classes_public TO anon, authenticated;

-- Make sure anon cannot read the checkin_token column directly
REVOKE SELECT (checkin_token) ON public.group_classes FROM anon, authenticated;
-- But staff still need it via the table (their policy passes); column grant for staff role:
GRANT SELECT (id, title, program, instructor, description, class_date, start_time,
              end_time, max_capacity, recurrence_group_id, is_recurring,
              created_at, updated_at, checkin_token)
  ON public.group_classes TO authenticated;
GRANT SELECT (id, title, program, instructor, description, class_date, start_time,
              end_time, max_capacity, recurrence_group_id, is_recurring,
              created_at, updated_at)
  ON public.group_classes TO anon;
