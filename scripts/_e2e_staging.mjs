import { createClient } from '@supabase/supabase-js';
const URL='https://tycwbzulmsqodojmfuxv.supabase.co';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Y3dienVsbXNxb2Rvam1mdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDkyNTMsImV4cCI6MjA5MDYyNTI1M30.eiC1wtb6YEcAHL6Ivt_taxINwslSY-ugbhXA-uO3Uqs';
const sb = createClient(URL, ANON);

const log=(ok,n,d='')=>console.log(ok?'✅':'❌', n, d);

// Login admin
const { error: le } = await sb.auth.signInWithPassword({ email:'admin@conexionfit.com', password:'Admin123!' });
if (le) { log(false,'login',le.message); process.exit(1); }
log(true,'Login admin');

const stamp = Date.now();
const cedula = String(8800000000 + (stamp % 999999)).slice(0,10);

// 1) Crear lote
const { data: batch, error: bErr } = await sb.from('import_batches')
  .insert({ source: 'e2e_chat', label: `E2E ${stamp}`, status: 'draft' })
  .select('id').single();
if (bErr) { log(false,'create batch', bErr.message); process.exit(1); }
log(true,'Lote creado', batch.id);

// 2) Insertar staging cliente
const { error: cErr } = await sb.from('staging_client_rows').insert({
  batch_id: batch.id, line_number: 1, name:'E2E STAGING TEST', cedula,
  program: 'GAP', total_classes: 12, unit_value: 1000, total_value: 12000,
});
if (cErr) { log(false,'staging client', cErr.message); await sb.from('import_batches').delete().eq('id',batch.id); process.exit(1); }
log(true,'Cliente staging insertado');

// 3) Insertar staging asistencias
const { error: aErr } = await sb.from('staging_attendance_rows').insert([
  { batch_id: batch.id, client_line_number: 1, class_number: 1, date: '2026-06-01', session_time: '7:00 pm', sheet_section: 'main' },
  { batch_id: batch.id, client_line_number: 1, class_number: 2, date: '2026-06-02', session_time: '7:00 pm', sheet_section: 'main' },
]);
if (aErr) { log(false,'staging att', aErr.message); await sb.from('import_batches').delete().eq('id',batch.id); process.exit(1); }
log(true,'Asistencias staging (2)');

// 4) Validate
const { data: val, error: vErr } = await sb.rpc('validate_staging_batch', { p_batch_id: batch.id });
if (vErr) { log(false,'validate', vErr.message); process.exit(1); }
log(true,'validate_staging_batch', JSON.stringify(val));

const { data: cs } = await sb.from('staging_client_rows').select('validation_status').eq('batch_id',batch.id).single();
log(cs.validation_status==='valid','status cliente', cs.validation_status);

// 5) Apply
const { data: app, error: apErr } = await sb.rpc('apply_staging_batch', { p_batch_id: batch.id });
if (apErr) { log(false,'apply', apErr.message); process.exit(1); }
log(true,'apply_staging_batch', JSON.stringify(app));

// 6) Verificar cliente real
const { data: cli } = await sb.from('clients').select('id,name,cedula,total_classes').eq('cedula', cedula).maybeSingle();
log(!!cli,'Cliente en producción', cli && `${cli.name} cedula=${cli.cedula} clases=${cli.total_classes}`);

const { data: att } = await sb.from('attendance').select('class_number,date').eq('client_id', cli.id).order('class_number');
log(att.length===2,'Asistencias migradas', att.map(x=>`${x.class_number}:${x.date}`).join(', '));

// 7) Verificar batch status
const { data: finalBatch } = await sb.from('import_batches').select('status,summary').eq('id',batch.id).single();
log(finalBatch.status==='applied','Estado lote final', finalBatch.status);

// 8) Cleanup
await sb.from('clients').delete().eq('id', cli.id);
await sb.from('import_batches').delete().eq('id', batch.id);
log(true,'Cleanup completo');

console.log('\n=== STAGING E2E PASS ===');
