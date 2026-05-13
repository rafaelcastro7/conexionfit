-- Campos de la plantilla física: hora y observaciones (instructor / notas)
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS session_time text,
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.attendance.session_time IS 'Hora de la sesión según planilla (ej. 7:00 pm)';
COMMENT ON COLUMN public.attendance.notes IS 'Observaciones / instructor (ej. Sebas, GIO)';

-- Portal y RPC: devolver hora y notas
CREATE OR REPLACE FUNCTION public.get_attendance_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  date text,
  class_number integer,
  session_time text,
  notes text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.client_id, a.date, a.class_number, a.session_time, a.notes, a.created_at
  FROM public.attendance a
  JOIN public.clients c ON c.id = a.client_id
  WHERE c.cedula = _cedula
  ORDER BY a.class_number
$$;
