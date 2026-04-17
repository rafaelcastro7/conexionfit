
DROP VIEW IF EXISTS public.group_classes_public;

CREATE VIEW public.group_classes_public
WITH (security_invoker = true) AS
SELECT
  id, title, program, instructor, description,
  class_date, start_time, end_time, max_capacity,
  recurrence_group_id, is_recurring, created_at, updated_at
FROM public.group_classes;

GRANT SELECT ON public.group_classes_public TO anon, authenticated;

-- Re-allow anon SELECT on base table (column-level grants already prevent token leak)
CREATE POLICY "Public can view classes"
ON public.group_classes FOR SELECT TO anon
USING (true);

-- Reaffirm column-level grants
REVOKE ALL ON public.group_classes FROM anon, authenticated;
GRANT SELECT (id, title, program, instructor, description, class_date, start_time,
              end_time, max_capacity, recurrence_group_id, is_recurring,
              created_at, updated_at)
  ON public.group_classes TO anon;
GRANT SELECT (id, title, program, instructor, description, class_date, start_time,
              end_time, max_capacity, recurrence_group_id, is_recurring,
              created_at, updated_at, checkin_token)
  ON public.group_classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.group_classes TO authenticated;
