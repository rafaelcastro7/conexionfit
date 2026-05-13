import { supabase as _supabase } from '@/integrations/supabase/client';
import type { SessionSheetImportPayload } from '@/lib/parseSessionSheet';

// Las tablas staging existen en BD pero los tipos generados aún no las exponen.
// Cast tipado-laxo SOLO para este servicio.
const supabase = _supabase as unknown as {
  from: (t: string) => any;
  rpc: (n: string, args?: any) => any;
};

export type ImportBatchStatus =
  | 'draft'
  | 'validated'
  | 'applying'
  | 'applied'
  | 'failed'
  | 'cancelled';

export interface ImportBatchRow {
  id: string;
  status: ImportBatchStatus;
  source: string;
  label: string | null;
  summary: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  applied_at: string | null;
}

export interface StagingClientRow {
  id: string;
  batch_id: string;
  line_number: number;
  name: string;
  cedula: string;
  program: string;
  total_classes: number;
  unit_value: number;
  total_value: number;
  phone: string | null;
  email: string | null;
  invoice_number: string | null;
  sheet_notes: string | null;
  validation_status: string;
  validation_errors: string[];
  duplicate_of_client_id: string | null;
  include_in_apply: boolean;
}

export interface StagingAttendanceRow {
  id: string;
  batch_id: string;
  client_line_number: number;
  class_number: number;
  date: string;
  session_time: string | null;
  signature: string | null;
  notes: string | null;
  sheet_section: string;
  validation_status: string;
  validation_errors: string[];
  include_in_apply: boolean;
}

export async function listImportBatches(): Promise<ImportBatchRow[]> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('id,status,source,label,summary,error_message,created_at,applied_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data || []) as ImportBatchRow[];
}

export async function createBatchFromSessionSheet(payload: SessionSheetImportPayload): Promise<string> {
  const cedula = payload.cedula.replace(/\D/g, '');
  const totalSessions = Math.max(
    payload.totalSessions,
    ...payload.rows.map((r) => r.classNumber),
    10
  );

  const { data: batch, error: bErr } = await supabase
    .from('import_batches')
    .insert({
      source: 'planilla_asistencia',
      label: `${payload.name} · CC ${cedula}`,
      status: 'draft',
    })
    .select('id')
    .single();

  if (bErr || !batch) throw new Error(bErr?.message || 'No se pudo crear el lote');

  const { error: cErr } = await supabase.from('staging_client_rows').insert({
    batch_id: batch.id,
    line_number: 1,
    name: payload.name.toUpperCase(),
    cedula,
    program: payload.program.toUpperCase(),
    total_classes: totalSessions,
    unit_value: payload.unitValue,
    total_value: totalSessions * payload.unitValue,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    invoice_number: payload.invoiceNumber?.trim() || null,
    sheet_notes: payload.sheetNotes?.trim() || null,
  });

  if (cErr) throw new Error(cErr.message);

  const attRows = payload.rows.map((r) => ({
    batch_id: batch.id,
    client_line_number: 1,
    class_number: r.classNumber,
    date: r.dateIso,
    session_time: r.sessionTime?.trim() || null,
    signature: r.signature?.trim() || null,
    notes: r.notes?.trim() || null,
    sheet_section: r.sheetSection,
  }));

  const { error: aErr } = await supabase.from('staging_attendance_rows').insert(attRows);
  if (aErr) throw new Error(aErr.message);

  return batch.id as string;
}

export interface ExcelStagingRow {
  name: string;
  cedula: string;
  program: string;
  totalClasses: number;
  unitValue: number;
  totalValue: number;
}

export async function createBatchFromExcelRows(label: string, rows: ExcelStagingRow[]): Promise<string> {
  if (rows.length === 0) throw new Error('Sin filas');

  const { data: batch, error: bErr } = await supabase
    .from('import_batches')
    .insert({
      source: 'excel_clientes',
      label,
      status: 'draft',
    })
    .select('id')
    .single();

  if (bErr || !batch) throw new Error(bErr?.message || 'No se pudo crear el lote');

  const clientRows = rows.map((r, i) => ({
    batch_id: batch.id,
    line_number: i + 1,
    name: r.name.toUpperCase(),
    cedula: r.cedula.replace(/\D/g, ''),
    program: r.program.toUpperCase(),
    total_classes: r.totalClasses,
    unit_value: r.unitValue,
    total_value: r.totalValue,
  }));

  const { error: cErr } = await supabase.from('staging_client_rows').insert(clientRows);
  if (cErr) throw new Error(cErr.message);

  return batch.id as string;
}

export async function fetchStagingClients(batchId: string): Promise<StagingClientRow[]> {
  const { data, error } = await supabase
    .from('staging_client_rows')
    .select('*')
    .eq('batch_id', batchId)
    .order('line_number');
  if (error) throw new Error(error.message);
  return (data || []) as StagingClientRow[];
}

export async function fetchImportBatch(batchId: string): Promise<ImportBatchRow | null> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('id,status,source,label,summary,error_message,created_at,applied_at')
    .eq('id', batchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ImportBatchRow) || null;
}

export async function fetchStagingAttendance(batchId: string): Promise<StagingAttendanceRow[]> {
  const { data, error } = await supabase
    .from('staging_attendance_rows')
    .select('*')
    .eq('batch_id', batchId)
    .order('client_line_number', { ascending: true })
    .order('class_number', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as StagingAttendanceRow[];
}

export async function updateStagingClientInclude(id: string, include: boolean): Promise<void> {
  const { error } = await supabase.from('staging_client_rows').update({ include_in_apply: include }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateStagingAttendanceInclude(id: string, include: boolean): Promise<void> {
  const { error } = await supabase.from('staging_attendance_rows').update({ include_in_apply: include }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteImportBatch(batchId: string): Promise<void> {
  const { error } = await supabase.from('import_batches').delete().eq('id', batchId);
  if (error) throw new Error(error.message);
}

export async function runValidateStagingBatch(batchId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('validate_staging_batch', { p_batch_id: batchId });
  if (error) throw new Error(error.message);
  return (data || {}) as Record<string, unknown>;
}

export async function runApplyStagingBatch(batchId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('apply_staging_batch', { p_batch_id: batchId });
  if (error) throw new Error(error.message);
  return (data || {}) as Record<string, unknown>;
}
