
-- 1. Remove permissive anonymous policies
DROP POLICY IF EXISTS "Public portal access clients" ON public.clients;
DROP POLICY IF EXISTS "Public portal access attendance" ON public.attendance;
DROP POLICY IF EXISTS "Anyone can view group classes" ON public.group_classes;
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- 2. Group classes: restrict raw access, expose safe view
CREATE POLICY "Staff can view group classes"
ON public.group_classes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'instructor'::app_role)
);

CREATE OR REPLACE VIEW public.group_classes_public AS
SELECT
  id, title, program, instructor, description,
  class_date, start_time, end_time, max_capacity,
  recurrence_group_id, is_recurring, created_at, updated_at
FROM public.group_classes;

GRANT SELECT ON public.group_classes_public TO anon, authenticated;

-- 3. Secure RPCs (using quoted "position" identifier where needed)

CREATE OR REPLACE FUNCTION public.get_client_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid, name text, cedula text, program text,
  total_classes integer, unit_value integer, total_value integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, cedula, program, total_classes, unit_value, total_value
  FROM public.clients WHERE cedula = _cedula
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid, client_id uuid, date text, class_number integer, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.client_id, a.date, a.class_number, a.created_at
  FROM public.attendance a
  JOIN public.clients c ON c.id = a.client_id
  WHERE c.cedula = _cedula
  ORDER BY a.class_number
$$;

CREATE OR REPLACE FUNCTION public.get_reservations_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid, class_id uuid, client_name text, client_cedula text,
  status text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, class_id, client_name, client_cedula, status, created_at
  FROM public.reservations WHERE client_cedula = _cedula
$$;

CREATE OR REPLACE FUNCTION public.get_waitlist_by_cedula(_cedula text)
RETURNS TABLE (
  id uuid, class_id uuid, client_name text, client_cedula text,
  wait_position integer, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, class_id, client_name, client_cedula, position AS wait_position, created_at
  FROM public.waitlist WHERE client_cedula = _cedula
$$;

CREATE OR REPLACE FUNCTION public.get_class_counts(_class_id uuid)
RETURNS TABLE (confirmed_count bigint, waitlist_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*) FROM public.reservations WHERE class_id = _class_id AND status = 'confirmed'),
    (SELECT COUNT(*) FROM public.waitlist WHERE class_id = _class_id)
$$;

CREATE OR REPLACE FUNCTION public.create_reservation(_class_id uuid, _cedula text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text; v_existing uuid; v_capacity integer; v_confirmed bigint; v_id uuid;
BEGIN
  SELECT name INTO v_name FROM public.clients WHERE cedula = _cedula;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Cédula no registrada'; END IF;

  SELECT id INTO v_existing FROM public.reservations
  WHERE class_id = _class_id AND client_cedula = _cedula AND status = 'confirmed';
  IF v_existing IS NOT NULL THEN RAISE EXCEPTION 'Ya tienes una reserva para esta clase'; END IF;

  SELECT max_capacity INTO v_capacity FROM public.group_classes WHERE id = _class_id;
  IF v_capacity IS NULL THEN RAISE EXCEPTION 'Clase no encontrada'; END IF;

  SELECT COUNT(*) INTO v_confirmed FROM public.reservations
  WHERE class_id = _class_id AND status = 'confirmed';
  IF v_confirmed >= v_capacity THEN RAISE EXCEPTION 'Clase llena'; END IF;

  INSERT INTO public.reservations (class_id, client_cedula, client_name, status)
  VALUES (_class_id, _cedula, v_name, 'confirmed') RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_waitlist(_class_id uuid, _cedula text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text; v_existing uuid; v_pos integer; v_id uuid;
BEGIN
  SELECT name INTO v_name FROM public.clients WHERE cedula = _cedula;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Cédula no registrada'; END IF;

  SELECT id INTO v_existing FROM public.waitlist
  WHERE class_id = _class_id AND client_cedula = _cedula;
  IF v_existing IS NOT NULL THEN RAISE EXCEPTION 'Ya estás en la lista de espera'; END IF;

  SELECT COALESCE(MAX(position), 0) + 1 INTO v_pos FROM public.waitlist WHERE class_id = _class_id;

  INSERT INTO public.waitlist (class_id, client_cedula, client_name, position)
  VALUES (_class_id, _cedula, v_name, v_pos) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.checkin_via_qr(_token uuid, _cedula text)
RETURNS TABLE (success boolean, message text, class_title text, class_number integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_class public.group_classes;
  v_client public.clients;
  v_attended integer; v_next integer; v_today text;
BEGIN
  SELECT * INTO v_class FROM public.group_classes WHERE checkin_token = _token;
  IF v_class.id IS NULL THEN
    RETURN QUERY SELECT false, 'Código QR inválido'::text, NULL::text, NULL::integer; RETURN;
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE cedula = _cedula;
  IF v_client.id IS NULL THEN
    RETURN QUERY SELECT false, 'Cédula no registrada'::text, v_class.title, NULL::integer; RETURN;
  END IF;

  SELECT COUNT(*) INTO v_attended FROM public.attendance WHERE client_id = v_client.id;
  IF v_attended >= v_client.total_classes THEN
    RETURN QUERY SELECT false, 'Paquete completado, renueva para continuar'::text, v_class.title, NULL::integer; RETURN;
  END IF;

  v_today := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  IF EXISTS (SELECT 1 FROM public.attendance WHERE client_id = v_client.id AND date = v_today) THEN
    RETURN QUERY SELECT false, 'Ya registraste asistencia hoy'::text, v_class.title, v_attended; RETURN;
  END IF;

  v_next := v_attended + 1;
  INSERT INTO public.attendance (client_id, date, class_number)
  VALUES (v_client.id, v_today, v_next);
  RETURN QUERY SELECT true, 'Asistencia registrada'::text, v_class.title, v_next;
END;
$$;

-- 4. Staff can view reservations & waitlist
CREATE POLICY "Staff can view reservations"
ON public.reservations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Staff can view waitlist"
ON public.waitlist FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'instructor'::app_role));

-- 5. Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Grants
GRANT EXECUTE ON FUNCTION public.get_client_by_cedula(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_by_cedula(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reservations_by_cedula(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_by_cedula(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_counts(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_waitlist(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_via_qr(uuid, text) TO anon, authenticated;
