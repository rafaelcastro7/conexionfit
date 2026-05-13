# Carga de planillas y Excel (staging → producción)

## Flujo profesional (cola de importación)

1. **Clientes** → **Importar** (Excel) o **Planilla**: los datos **no** van directo a `clients` / `attendance`.
2. Se crea un **lote** (`import_batches`) con filas en **`staging_client_rows`** y, si aplica, **`staging_attendance_rows`**.
3. Menú **Importaciones** (`/imports`): abres el lote → **Ejecutar validación** (RPC `validate_staging_batch`).
4. Revisas estados: `valid`, `duplicate_production` (fusionará al aplicar), `duplicate_batch` / `invalid` (no pasan), `warning` en asistencias (reemplazo en producción).
5. Puedes **desmarcar** filas con el checkbox *Incluir al aplicar*.
6. **Aplicar a producción** (RPC `apply_staging_batch`) solo si el lote está en estado `validated`.

## Planilla física

- **Cabecera:** NOMBRE, CC, SESIONES (`20 + 2`), programa, valor unitario, opcional CEL, CORREO, No. FAC, notas cabecera.
- **Tabla:** No. CLASE | FECHA | HORA | [FIRMA] | OBSERVACIONES (tabuladores).
- **Clases de adición:** línea sola `---ADICION---` (o título “CLASES DE ADICIÓN”); las filas siguientes llevan `sheet_section = adicional`.

## Excel de clientes

Columnas: `NOMBRE`, `CEDULA`, `PROGRAMA`, `CLASES`, `VALOR_UNITARIO`. Solo filas válidas entran al staging.

## Migraciones Supabase

Aplicar en orden (incluye columnas de planilla y módulo staging):

- `20260512180000_attendance_session_notes.sql` (si aún no está)
- `20260512200000_planilla_schema.sql` (opcional cabecera extendida)
- **`20260513120000_import_staging.sql`** — tablas de staging + `validate_staging_batch` + `apply_staging_batch`

## PDF

Solo útil con **texto seleccionable**. Manuscrito escaneado: transcribir a Excel y pegar tabla.
