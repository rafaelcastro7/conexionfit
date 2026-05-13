-- =============================================================================
-- Módulo de carga en staging: validación, duplicados y promoción a producción
-- =============================================================================

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sheet_notes text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS session_time text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS sheet_section text DEFAULT 'main';
UPDATE public.attendance SET sheet_section = 'main' WHERE sheet_section IS NULL;

CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'validated', 'applying', 'applied', 'failed', 'cancelled')),
  source text NOT NULL DEFAULT 'unknown',
  label text,
  summary jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE public.staging_client_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.import_batches (id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  name text NOT NULL DEFAULT '',
  cedula text NOT NULL DEFAULT '',
  program text NOT NULL DEFAULT '',
  total_classes integer NOT NULL DEFAULT 0,
  unit_value integer NOT NULL DEFAULT 0,
  total_value integer NOT NULL DEFAULT 0,
  phone text,
  email text,
  invoice_number text,
  sheet_notes text,
  validation_status text NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'invalid', 'duplicate_batch', 'duplicate_production')),
  validation_errors text[] NOT NULL DEFAULT '{}',
  duplicate_of_client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  include_in_apply boolean NOT NULL DEFAULT true,
  UNIQUE (batch_id, line_number)
);

CREATE TABLE public.staging_attendance_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.import_batches (id) ON DELETE CASCADE,
  client_line_number integer NOT NULL,
  class_number integer NOT NULL,
  date text NOT NULL,
  session_time text,
  signature text,
  notes text,
  sheet_section text NOT NULL DEFAULT 'main' CHECK (sheet_section IN ('main', 'adicional')),
  validation_status text NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'invalid', 'warning')),
  validation_errors text[] NOT NULL DEFAULT '{}',
  include_in_apply boolean NOT NULL DEFAULT true,
  UNIQUE (batch_id, client_line_number, class_number)
);

CREATE INDEX staging_client_rows_batch_idx ON public.staging_client_rows (batch_id);
CREATE INDEX staging_attendance_rows_batch_idx ON public.staging_attendance_rows (batch_id);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_client_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_attendance_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_batches_admin_all ON public.import_batches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY staging_client_rows_admin_all ON public.staging_client_rows
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY staging_attendance_rows_admin_all ON public.staging_attendance_rows
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- -----------------------------------------------------------------------------
-- validate_staging_batch: reglas de negocio + duplicados (lote y producción)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_staging_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clients int;
  v_att int;
  v_ok int;
  v_bad int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.import_batches WHERE id = p_batch_id) THEN
    RAISE EXCEPTION 'Lote no encontrado';
  END IF;

  UPDATE public.staging_client_rows
  SET validation_status = 'pending', validation_errors = '{}', duplicate_of_client_id = NULL
  WHERE batch_id = p_batch_id;

  UPDATE public.staging_attendance_rows
  SET validation_status = 'pending', validation_errors = '{}'
  WHERE batch_id = p_batch_id;

  -- Cliente: campos obligatorios
  UPDATE public.staging_client_rows scr
  SET validation_status = 'invalid',
      validation_errors = ARRAY['Nombre obligatorio']
  WHERE scr.batch_id = p_batch_id AND btrim(scr.name) = '';

  UPDATE public.staging_client_rows scr
  SET validation_status = 'invalid',
      validation_errors = scr.validation_errors || ARRAY['Cédula obligatoria']
  WHERE scr.batch_id = p_batch_id AND btrim(scr.cedula) = '';

  UPDATE public.staging_client_rows scr
  SET validation_status = 'invalid',
      validation_errors = scr.validation_errors || ARRAY['Programa obligatorio']
  WHERE scr.batch_id = p_batch_id AND btrim(scr.program) = '';

  UPDATE public.staging_client_rows scr
  SET validation_status = 'invalid',
      validation_errors = scr.validation_errors || ARRAY['Número de clases inválido']
  WHERE scr.batch_id = p_batch_id AND (scr.total_classes IS NULL OR scr.total_classes < 1);

  UPDATE public.staging_client_rows scr
  SET validation_status = 'invalid',
      validation_errors = scr.validation_errors || ARRAY['Valor unitario inválido']
  WHERE scr.batch_id = p_batch_id AND (scr.unit_value IS NULL OR scr.unit_value < 0);

  -- Duplicado dentro del mismo lote (CC normalizado + programa)
  WITH dup AS (
    SELECT batch_id, regexp_replace(cedula, '[^0-9]', '', 'g') AS cnorm, upper(btrim(program)) AS pnorm
    FROM public.staging_client_rows
    WHERE batch_id = p_batch_id
    GROUP BY batch_id, regexp_replace(cedula, '[^0-9]', '', 'g'), upper(btrim(program))
    HAVING count(*) > 1
  )
  UPDATE public.staging_client_rows s
  SET validation_status = 'duplicate_batch',
      validation_errors = s.validation_errors || ARRAY['Duplicado CC+programa dentro del mismo lote']
  FROM dup d
  WHERE s.batch_id = p_batch_id
    AND s.batch_id = d.batch_id
    AND regexp_replace(s.cedula, '[^0-9]', '', 'g') = d.cnorm
    AND upper(btrim(s.program)) = d.pnorm
    AND s.validation_status <> 'invalid';

  -- Ya existe en producción (mismo CC + programa)
  UPDATE public.staging_client_rows s
  SET duplicate_of_client_id = c.id,
      validation_status = CASE
        WHEN s.validation_status = 'invalid' THEN 'invalid'
        ELSE 'duplicate_production'
      END,
      validation_errors = CASE
        WHEN s.validation_status = 'invalid' THEN s.validation_errors
        ELSE s.validation_errors || ARRAY['Cliente+programa ya existe en producción; se fusionará al aplicar']
      END
  FROM public.clients c
  WHERE s.batch_id = p_batch_id
    AND s.validation_status NOT IN ('invalid', 'duplicate_batch')
    AND regexp_replace(s.cedula, '[^0-9]', '', 'g') = regexp_replace(c.cedula, '[^0-9]', '', 'g')
    AND upper(btrim(s.program)) = upper(btrim(c.program));

  UPDATE public.staging_client_rows
  SET validation_status = 'valid'
  WHERE batch_id = p_batch_id AND validation_status = 'pending';

  -- Asistencias: cliente de línea inexistente o con error
  UPDATE public.staging_attendance_rows sar
  SET validation_status = 'invalid',
      validation_errors = ARRAY['La línea de cliente no existe en el lote']
  WHERE sar.batch_id = p_batch_id
    AND NOT EXISTS (
      SELECT 1 FROM public.staging_client_rows scr
      WHERE scr.batch_id = sar.batch_id AND scr.line_number = sar.client_line_number
    );

  UPDATE public.staging_attendance_rows sar
  SET validation_status = 'invalid',
      validation_errors = ARRAY['El cliente de esta línea tiene errores de validación']
  WHERE sar.batch_id = p_batch_id
    AND EXISTS (
      SELECT 1 FROM public.staging_client_rows scr
      WHERE scr.batch_id = sar.batch_id
        AND scr.line_number = sar.client_line_number
        AND scr.validation_status IN ('invalid', 'duplicate_batch')
    );

  UPDATE public.staging_attendance_rows sar
  SET validation_status = 'invalid',
      validation_errors = sar.validation_errors || ARRAY['Fecha debe ser YYYY-MM-DD']
  WHERE sar.batch_id = p_batch_id
    AND sar.validation_status <> 'invalid'
    AND (sar.date IS NULL OR sar.date !~ '^\d{4}-\d{2}-\d{2}$');

  UPDATE public.staging_attendance_rows sar
  SET validation_status = 'invalid',
      validation_errors = sar.validation_errors || ARRAY['Número de clase inválido']
  WHERE sar.batch_id = p_batch_id
    AND sar.validation_status <> 'invalid'
    AND (sar.class_number IS NULL OR sar.class_number < 1);

  -- Advertencia: asistencia ya en producción (reemplazo al aplicar)
  UPDATE public.staging_attendance_rows sar
  SET validation_status = 'warning',
      validation_errors = sar.validation_errors || ARRAY['Ya existe esta clase en producción; se reemplazará al aplicar']
  WHERE sar.batch_id = p_batch_id
    AND sar.validation_status NOT IN ('invalid')
    AND EXISTS (
      SELECT 1
      FROM public.staging_client_rows scr
      JOIN public.clients c ON (
        scr.duplicate_of_client_id = c.id
        OR (
          scr.duplicate_of_client_id IS NULL
          AND regexp_replace(scr.cedula, '[^0-9]', '', 'g') = regexp_replace(c.cedula, '[^0-9]', '', 'g')
          AND upper(btrim(scr.program)) = upper(btrim(c.program))
        )
      )
      WHERE scr.batch_id = sar.batch_id
        AND scr.line_number = sar.client_line_number
        AND EXISTS (
          SELECT 1 FROM public.attendance a
          WHERE a.client_id = c.id AND a.class_number = sar.class_number
        )
    );

  UPDATE public.staging_attendance_rows
  SET validation_status = 'valid'
  WHERE batch_id = p_batch_id AND validation_status = 'pending';

  UPDATE public.import_batches
  SET status = 'validated', summary = jsonb_build_object(
    'validated_at', to_jsonb(now())
  )
  WHERE id = p_batch_id;

  SELECT count(*) INTO v_clients FROM public.staging_client_rows WHERE batch_id = p_batch_id;
  SELECT count(*) INTO v_att FROM public.staging_attendance_rows WHERE batch_id = p_batch_id;
  SELECT count(*) INTO v_ok FROM public.staging_client_rows
  WHERE batch_id = p_batch_id AND validation_status IN ('valid', 'duplicate_production') AND include_in_apply;
  SELECT count(*) INTO v_bad FROM public.staging_client_rows
  WHERE batch_id = p_batch_id AND validation_status IN ('invalid', 'duplicate_batch');

  RETURN jsonb_build_object(
    'staging_clients', v_clients,
    'staging_attendance', v_att,
    'clients_ready', v_ok,
    'clients_blocked', v_bad
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_staging_batch(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- apply_staging_batch: promueve filas válidas a clients + attendance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_staging_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scr RECORD;
  sar RECORD;
  v_client_id uuid;
  v_map jsonb := '{}'::jsonb;
  n_clients int := 0;
  n_att int := 0;
  n_skipped_clients int := 0;
  n_skipped_att int := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.import_batches WHERE id = p_batch_id AND status = 'validated') THEN
    RAISE EXCEPTION 'El lote debe estar en estado validated';
  END IF;

  UPDATE public.import_batches SET status = 'applying' WHERE id = p_batch_id;

  FOR scr IN
    SELECT * FROM public.staging_client_rows
    WHERE batch_id = p_batch_id
      AND include_in_apply
      AND validation_status IN ('valid', 'duplicate_production')
    ORDER BY line_number
  LOOP
    IF scr.validation_status = 'duplicate_production' THEN
      IF scr.duplicate_of_client_id IS NOT NULL THEN
        v_client_id := scr.duplicate_of_client_id;
      ELSE
        SELECT c.id INTO v_client_id
        FROM public.clients c
        WHERE regexp_replace(c.cedula, '[^0-9]', '', 'g') = regexp_replace(scr.cedula, '[^0-9]', '', 'g')
          AND upper(btrim(c.program)) = upper(btrim(scr.program))
        LIMIT 1;
      END IF;
      IF v_client_id IS NULL THEN
        n_skipped_clients := n_skipped_clients + 1;
        CONTINUE;
      END IF;
      UPDATE public.clients c
      SET
        name = CASE WHEN btrim(scr.name) <> '' THEN upper(btrim(scr.name)) ELSE c.name END,
        total_classes = GREATEST(c.total_classes, scr.total_classes),
        unit_value = scr.unit_value,
        total_value = GREATEST(c.total_classes, scr.total_classes) * scr.unit_value,
        phone = COALESCE(NULLIF(btrim(scr.phone), ''), c.phone),
        email = COALESCE(NULLIF(btrim(scr.email), ''), c.email),
        invoice_number = COALESCE(NULLIF(btrim(scr.invoice_number), ''), c.invoice_number),
        sheet_notes = COALESCE(NULLIF(btrim(scr.sheet_notes), ''), c.sheet_notes),
        updated_at = now()
      WHERE c.id = v_client_id;
      n_clients := n_clients + 1;
    ELSIF scr.validation_status = 'valid' THEN
      INSERT INTO public.clients (
        name, cedula, program, total_classes, unit_value, total_value,
        phone, email, invoice_number, sheet_notes
      )
      VALUES (
        upper(btrim(scr.name)),
        regexp_replace(scr.cedula, '[^0-9]', '', 'g'),
        upper(btrim(scr.program)),
        scr.total_classes,
        scr.unit_value,
        scr.total_classes * scr.unit_value,
        NULLIF(btrim(scr.phone), ''),
        NULLIF(btrim(scr.email), ''),
        NULLIF(btrim(scr.invoice_number), ''),
        NULLIF(btrim(scr.sheet_notes), '')
      )
      RETURNING id INTO v_client_id;
      n_clients := n_clients + 1;
    ELSE
      n_skipped_clients := n_skipped_clients + 1;
      CONTINUE;
    END IF;

    v_map := v_map || jsonb_build_object(scr.line_number::text, to_jsonb(v_client_id));
  END LOOP;

  FOR sar IN
    SELECT * FROM public.staging_attendance_rows
    WHERE batch_id = p_batch_id
      AND include_in_apply
      AND validation_status IN ('valid', 'warning')
    ORDER BY client_line_number, class_number
  LOOP
    v_client_id := NULL;
    IF v_map ? sar.client_line_number::text THEN
      v_client_id := (v_map->>sar.client_line_number::text)::uuid;
    END IF;

    IF v_client_id IS NULL THEN
      n_skipped_att := n_skipped_att + 1;
      CONTINUE;
    END IF;

    DELETE FROM public.attendance
    WHERE client_id = v_client_id AND class_number = sar.class_number;

    INSERT INTO public.attendance (
      client_id, class_number, date, session_time, signature, notes, sheet_section
    )
    VALUES (
      v_client_id,
      sar.class_number,
      sar.date,
      NULLIF(btrim(sar.session_time), ''),
      NULLIF(btrim(sar.signature), ''),
      NULLIF(btrim(sar.notes), ''),
      sar.sheet_section
    );
    n_att := n_att + 1;
  END LOOP;

  UPDATE public.import_batches
  SET
    status = 'applied',
    applied_at = now(),
    summary = coalesce(summary, '{}'::jsonb) || jsonb_build_object(
      'applied', jsonb_build_object(
        'clients_upserted', n_clients,
        'attendance_inserted', n_att,
        'skipped_clients', n_skipped_clients,
        'skipped_attendance', n_skipped_att
      )
    ),
    error_message = NULL
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'clients_upserted', n_clients,
    'attendance_inserted', n_att,
    'skipped_clients', n_skipped_clients,
    'skipped_attendance', n_skipped_att
  );
EXCEPTION WHEN OTHERS THEN
  UPDATE public.import_batches
  SET status = 'failed', error_message = SQLERRM
  WHERE id = p_batch_id;
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_staging_batch(uuid) TO authenticated;

COMMENT ON TABLE public.import_batches IS 'Lotes de carga previa a producción (staging)';
COMMENT ON TABLE public.staging_client_rows IS 'Filas de cliente pendientes de validación/aplicación';
COMMENT ON TABLE public.staging_attendance_rows IS 'Filas de asistencia ligadas a line_number de cliente en el mismo lote';
