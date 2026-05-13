-- Esquema alineado con planilla física Conexion Fit (cabecera + tabla + clases de adición)

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS sheet_notes text;

COMMENT ON COLUMN public.clients.phone IS 'CEL. en planilla';
COMMENT ON COLUMN public.clients.email IS 'CORREO en planilla';
COMMENT ON COLUMN public.clients.invoice_number IS 'No. FAC / factura';
COMMENT ON COLUMN public.clients.sheet_notes IS 'CUMPLE u otras notas de cabecera';

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS sheet_section text NOT NULL DEFAULT 'main';

COMMENT ON COLUMN public.attendance.signature IS 'FIRMA (texto / iniciales en planilla)';
COMMENT ON COLUMN public.attendance.sheet_section IS 'main = tabla principal; adicional = bloque CLASES DE ADICIÓN';

CREATE OR REPLACE FUNCTION public.get_client_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid,
  name text,
  cedula text,
  program text,
  total_classes integer,
  unit_value integer,
  total_value integer,
  phone text,
  email text,
  invoice_number text,
  sheet_notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, name, cedula, program, total_classes, unit_value, total_value,
    phone, email, invoice_number, sheet_notes
  FROM public.clients
  WHERE cedula = _cedula
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  date text,
  class_number integer,
  session_time text,
  notes text,
  signature text,
  sheet_section text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id, a.client_id, a.date, a.class_number,
    a.session_time, a.notes, a.signature, a.sheet_section, a.created_at
  FROM public.attendance a
  JOIN public.clients c ON c.id = a.client_id
  WHERE c.cedula = _cedula
  ORDER BY
    CASE WHEN a.sheet_section = 'adicional' THEN 1 ELSE 0 END,
    a.class_number
$$;
