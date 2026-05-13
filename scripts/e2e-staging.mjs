/**
 * Prueba end-to-end del flujo staging contra el proyecto configurado en .env
 * (misma URL/clave anónima que Vite).
 *
 * Requiere en el entorno:
 *   E2E_ADMIN_EMAIL
 *   E2E_ADMIN_PASSWORD
 *
 * Ejemplo (PowerShell):
 *   $env:E2E_ADMIN_EMAIL="tu@correo.com"; $env:E2E_ADMIN_PASSWORD="***"; node scripts/e2e-staging.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadDotEnv() {
  const p = join(root, '.env');
  if (!existsSync(p)) {
    console.error('No existe .env en', p);
    process.exit(1);
  }
  const out = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim().replace(/^["']|["']$/g, '');
    out[k] = v;
  }
  return out;
}

const env = loadDotEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const anon = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

if (!url || !anon) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env');
  process.exit(1);
}

if (!email || !password) {
  console.error('Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para probar el flujo con sesión admin.');
  console.error('Ejemplo PowerShell:');
  console.error('  $env:E2E_ADMIN_EMAIL="admin@..."; $env:E2E_ADMIN_PASSWORD="..."; node scripts/e2e-staging.mjs');
  process.exit(1);
}

const supabase = createClient(url, anon);

async function main() {
  console.log('1) Auth.signInWithPassword…');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr || !authData.session) {
    console.error('Login falló:', authErr?.message || 'sin sesión');
    process.exit(1);
  }
  console.log('   OK usuario:', authData.user.id);

  console.log('2) Rol admin…');
  const { data: roleRow, error: roleErr } = await supabase.from('user_roles').select('role').eq('user_id', authData.user.id).maybeSingle();
  if (roleErr) {
    console.error('No se pudo leer user_roles:', roleErr.message, roleErr);
    process.exit(1);
  }
  if (roleRow?.role !== 'admin') {
    console.error('El usuario no tiene role admin (tiene:', roleRow?.role, '). Sin admin no hay staging.');
    process.exit(1);
  }
  console.log('   OK admin');

  const stamp = Date.now();
  const cedula = String(8800000000 + (stamp % 999999)).slice(0, 10);

  console.log('3) Crear lote + staging (cédula de prueba', cedula + ')…');
  const { data: batch, error: bErr } = await supabase
    .from('import_batches')
    .insert({ source: 'e2e_script', label: `E2E ${stamp}`, status: 'draft' })
    .select('id')
    .single();
  if (bErr || !batch) {
    console.error('insert import_batches falló:', bErr?.message, bErr);
    console.error('¿Aplicaste la migración 20260513120000_import_staging.sql en Supabase?');
    process.exit(1);
  }
  const batchId = batch.id;
  console.log('   batch_id', batchId);

  const { error: cErr } = await supabase.from('staging_client_rows').insert({
    batch_id: batchId,
    line_number: 1,
    name: 'E2E STAGING',
    cedula,
    program: 'GAP',
    total_classes: 12,
    unit_value: 1000,
    total_value: 12000,
  });
  if (cErr) {
    console.error('insert staging_client_rows:', cErr.message, cErr);
    await supabase.from('import_batches').delete().eq('id', batchId);
    process.exit(1);
  }

  const { error: aErr } = await supabase.from('staging_attendance_rows').insert([
    {
      batch_id: batchId,
      client_line_number: 1,
      class_number: 1,
      date: '2026-06-01',
      session_time: '7:00 pm',
      notes: 'e2e',
      sheet_section: 'main',
    },
    {
      batch_id: batchId,
      client_line_number: 1,
      class_number: 2,
      date: '2026-06-02',
      session_time: '7:00 pm',
      notes: 'e2e',
      sheet_section: 'main',
    },
  ]);
  if (aErr) {
    console.error('insert staging_attendance_rows:', aErr.message, aErr);
    await supabase.from('import_batches').delete().eq('id', batchId);
    process.exit(1);
  }

  console.log('4) RPC validate_staging_batch…');
  const { data: val, error: vErr } = await supabase.rpc('validate_staging_batch', { p_batch_id: batchId });
  if (vErr) {
    console.error('validate_staging_batch:', vErr.message, vErr);
    process.exit(1);
  }
  console.log('   ', JSON.stringify(val));

  const { data: sc } = await supabase.from('staging_client_rows').select('validation_status').eq('batch_id', batchId).single();
  const { data: sa } = await supabase.from('staging_attendance_rows').select('validation_status').eq('batch_id', batchId);
  console.log('   cliente:', sc?.validation_status, '| asistencias:', (sa || []).map((r) => r.validation_status).join(','));

  console.log('5) RPC apply_staging_batch…');
  const { data: app, error: aApply } = await supabase.rpc('apply_staging_batch', { p_batch_id: batchId });
  if (aApply) {
    console.error('apply_staging_batch:', aApply.message, aApply);
    process.exit(1);
  }
  console.log('   ', JSON.stringify(app));

  const { data: cli } = await supabase.from('clients').select('id,name,cedula').eq('cedula', cedula).maybeSingle();
  if (!cli) {
    console.error('No apareció el cliente en producción tras apply.');
    process.exit(1);
  }
  console.log('6) Cliente en producción:', cli.id, cli.name, cli.cedula);

  const { data: att, error: attE } = await supabase.from('attendance').select('class_number,date').eq('client_id', cli.id).order('class_number');
  if (attE) console.error(attE);
  console.log('   Asistencias:', (att || []).map((x) => `${x.class_number}:${x.date}`).join(', '));

  console.log('7) Limpieza (borra cliente de prueba)…');
  await supabase.from('clients').delete().eq('id', cli.id);
  await supabase.from('import_batches').delete().eq('id', batchId);

  console.log('\nE2E staging: OK');
  await supabase.auth.signOut();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
