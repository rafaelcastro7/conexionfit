CREATE OR REPLACE FUNCTION public.get_class_by_checkin_token(_token uuid)
RETURNS TABLE(
  id uuid,
  title text,
  program text,
  instructor text,
  description text,
  class_date date,
  start_time time without time zone,
  end_time time without time zone,
  max_capacity integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, title, program, instructor, description, class_date, start_time, end_time, max_capacity
  FROM public.group_classes
  WHERE checkin_token = _token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_class_by_checkin_token(uuid) TO anon, authenticated;