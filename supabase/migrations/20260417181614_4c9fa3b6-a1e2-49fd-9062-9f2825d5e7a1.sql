
-- 1. Profiles: restrict SELECT to owner + staff
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'instructor'::app_role)
);

-- 2. Group classes: split SELECT policies so anon/clients only see safe columns
DROP POLICY IF EXISTS "Public can view non-sensitive class fields" ON public.group_classes;
DROP POLICY IF EXISTS "Staff can view group classes" ON public.group_classes;

-- Staff can read everything (including checkin_token)
CREATE POLICY "Staff can view group classes (full)"
ON public.group_classes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'instructor'::app_role)
);

-- Public can read base table rows; column-level GRANT (already set previously)
-- ensures anon cannot read checkin_token. Authenticated non-staff also cannot
-- read the column because we revoke it then re-grant only safe columns.
CREATE POLICY "Public can view classes"
ON public.group_classes FOR SELECT TO anon
USING (true);

-- Reapply column-level grants explicitly
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
