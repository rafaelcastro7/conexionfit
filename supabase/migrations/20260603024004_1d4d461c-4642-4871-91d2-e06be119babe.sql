CREATE SEQUENCE IF NOT EXISTS public.clients_codigo_seq START 1;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

WITH ordered AS (
  SELECT cedula, MIN(created_at) AS first_created
  FROM public.clients WHERE codigo IS NULL GROUP BY cedula
), numbered AS (
  SELECT cedula, 'C-' || lpad(row_number() OVER (ORDER BY first_created)::text, 4, '0') AS new_codigo
  FROM ordered
)
UPDATE public.clients c SET codigo = n.new_codigo
FROM numbered n WHERE c.cedula = n.cedula AND c.codigo IS NULL;

SELECT setval('public.clients_codigo_seq',
  GREATEST(1, (SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '\D', '', 'g'), '')::int), 0) FROM public.clients)), true);

ALTER TABLE public.clients ALTER COLUMN codigo SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_status_check') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_status_check CHECK (status IN ('active','inactive'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS clients_codigo_idx ON public.clients (codigo);

CREATE OR REPLACE FUNCTION public.check_codigo_single_cedula()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.clients WHERE codigo = NEW.codigo AND cedula <> NEW.cedula) THEN
    RAISE EXCEPTION 'El código % ya está asignado a otra cédula', NEW.codigo;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_check_codigo_single_cedula ON public.clients;
CREATE TRIGGER trg_check_codigo_single_cedula
BEFORE INSERT OR UPDATE OF codigo, cedula ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.check_codigo_single_cedula();

CREATE OR REPLACE FUNCTION public.assign_client_codigo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing text;
BEGIN
  IF NEW.codigo IS NULL OR btrim(NEW.codigo) = '' THEN
    SELECT codigo INTO v_existing FROM public.clients WHERE cedula = NEW.cedula AND codigo IS NOT NULL LIMIT 1;
    IF v_existing IS NOT NULL THEN NEW.codigo := v_existing;
    ELSE NEW.codigo := 'C-' || lpad(nextval('public.clients_codigo_seq')::text, 4, '0');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_assign_client_codigo ON public.clients;
CREATE TRIGGER trg_assign_client_codigo BEFORE INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.assign_client_codigo();

CREATE OR REPLACE FUNCTION public.create_reservation(_class_id uuid, _cedula text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_status text; v_existing uuid; v_capacity integer; v_confirmed bigint; v_id uuid;
BEGIN
  SELECT name, status INTO v_name, v_status FROM public.clients WHERE cedula = _cedula LIMIT 1;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Cédula no registrada'; END IF;
  IF v_status = 'inactive' THEN RAISE EXCEPTION 'Cliente inactivo: contacta al administrador'; END IF;
  SELECT id INTO v_existing FROM public.reservations WHERE class_id = _class_id AND client_cedula = _cedula AND status = 'confirmed';
  IF v_existing IS NOT NULL THEN RAISE EXCEPTION 'Ya tienes una reserva para esta clase'; END IF;
  SELECT max_capacity INTO v_capacity FROM public.group_classes WHERE id = _class_id;
  IF v_capacity IS NULL THEN RAISE EXCEPTION 'Clase no encontrada'; END IF;
  SELECT COUNT(*) INTO v_confirmed FROM public.reservations WHERE class_id = _class_id AND status = 'confirmed';
  IF v_confirmed >= v_capacity THEN RAISE EXCEPTION 'Clase llena'; END IF;
  INSERT INTO public.reservations (class_id, client_cedula, client_name, status)
  VALUES (_class_id, _cedula, v_name, 'confirmed') RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.checkin_via_qr(_token uuid, _cedula text)
RETURNS TABLE(success boolean, message text, class_title text, class_number integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_class public.group_classes; v_client public.clients; v_attended integer; v_next integer; v_today text;
BEGIN
  SELECT * INTO v_class FROM public.group_classes WHERE checkin_token = _token;
  IF v_class.id IS NULL THEN RETURN QUERY SELECT false, 'Código QR inválido'::text, NULL::text, NULL::integer; RETURN; END IF;
  SELECT * INTO v_client FROM public.clients WHERE cedula = _cedula LIMIT 1;
  IF v_client.id IS NULL THEN RETURN QUERY SELECT false, 'Cédula no registrada'::text, v_class.title, NULL::integer; RETURN; END IF;
  IF v_client.status = 'inactive' THEN RETURN QUERY SELECT false, 'Cliente inactivo: contacta al administrador'::text, v_class.title, NULL::integer; RETURN; END IF;
  SELECT COUNT(*) INTO v_attended FROM public.attendance WHERE client_id = v_client.id;
  IF v_attended >= v_client.total_classes THEN RETURN QUERY SELECT false, 'Paquete completado, renueva para continuar'::text, v_class.title, NULL::integer; RETURN; END IF;
  v_today := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  IF EXISTS (SELECT 1 FROM public.attendance WHERE client_id = v_client.id AND date = v_today) THEN
    RETURN QUERY SELECT false, 'Ya registraste asistencia hoy'::text, v_class.title, v_attended; RETURN;
  END IF;
  v_next := v_attended + 1;
  INSERT INTO public.attendance (client_id, date, class_number) VALUES (v_client.id, v_today, v_next);
  RETURN QUERY SELECT true, 'Asistencia registrada'::text, v_class.title, v_next;
END; $$;

DROP FUNCTION IF EXISTS public.get_client_by_cedula(text);
CREATE FUNCTION public.get_client_by_cedula(_cedula text)
RETURNS TABLE(id uuid, name text, cedula text, codigo text, status text, program text, total_classes integer, unit_value integer, total_value integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, cedula, codigo, status, program, total_classes, unit_value, total_value
  FROM public.clients WHERE cedula = _cedula
$$;