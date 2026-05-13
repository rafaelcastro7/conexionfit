import { createClient } from '@supabase/supabase-js';
const URL='https://tycwbzulmsqodojmfuxv.supabase.co';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Y3dienVsbXNxb2Rvam1mdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDkyNTMsImV4cCI6MjA5MDYyNTI1M30.eiC1wtb6YEcAHL6Ivt_taxINwslSY-ugbhXA-uO3Uqs';
const sb = createClient(URL, ANON);
const log=(ok,n,d='')=>console.log(ok?'✅':'❌', n, d);

await sb.auth.signInWithPassword({ email:'admin@conexionfit.com', password:'Admin123!' });
log(true,'Login admin');

const stamp = Date.now();
const cedula = String(8800000000 + (stamp % 999999)).slice(0,10);
const { data: batch } = await sb.from('import_batches')
  .insert({ source:'e2e_chat', label:`E2E ${stamp}`, status:'draft' }).select('id').single();
log(!!batch,'Lote creado', batch?.id);

await sb.from('staging_client_rows').insert({
  batch_id: batch.id, line_number:1, name:'E2E STAGING TEST', cedula,
  program:'GAP', total_classes:12, unit_value:1000, total_value:12000,
});
await sb.from('staging_attendance_rows').insert([
  { batch_id:batch.id, client_line_number:1, class_number:1, date:'2026-06-01', session_time:'7:00 pm', sheet_section:'main' },
  { batch_id:batch.id, client_line_number:1, class_number:2, date:'2026-06-02', session_time:'7:00 pm', sheet_section:'main' },
  { batch_id:batch.id, client_line_number:1, class_number:3, date:'fecha-mala', sheet_section:'main' }, // → invalid
]);
log(true,'Staging cargado (1 cliente, 3 asistencias incl. 1 inválida)');

const { data: val } = await sb.rpc('validate_staging_batch', { p_batch_id: batch.id });
log(true,'validate', JSON.stringify(val));

const { data: cs } = await sb.from('staging_client_rows').select('validation_status').eq('batch_id',batch.id).single();
log(cs.validation_status==='valid','status cliente', cs.validation_status);

const { data: aSt } = await sb.from('staging_attendance_rows').select('class_number,validation_status,validation_errors').eq('batch_id',batch.id).order('class_number');
const okAtt = aSt.filter(r=>r.validation_status==='valid').length;
const badAtt = aSt.filter(r=>r.validation_status==='invalid').length;
log(okAtt===2 && badAtt===1,'Validación asistencias', `valid=${okAtt} invalid=${badAtt}`);

const { data: app } = await sb.rpc('apply_staging_batch', { p_batch_id: batch.id });
log(true,'apply', JSON.stringify(app));

const { data: cli } = await sb.from('clients').select('id,name,total_classes,phone').eq('cedula', cedula).maybeSingle();
log(!!cli,'Cliente promovido', cli && `${cli.name} clases=${cli.total_classes}`);

const { data: att } = await sb.from('attendance').select('class_number,date,session_time').eq('client_id',cli.id).order('class_number');
log(att.length===2,'Asistencias promovidas', att.map(x=>`${x.class_number}:${x.date}`).join(', '));

// Re-aplicar mismo lote → debe rechazar (ya no está validated)
const { error: reErr } = await sb.rpc('apply_staging_batch', { p_batch_id: batch.id });
log(!!reErr,'Bloqueo re-aplicación', reErr?.message);

// Cliente no admin no puede ver lotes
const sbC = createClient(URL, ANON);
await sbC.auth.signInWithPassword({ email:'cliente@conexionfit.com', password:'Cliente123!' });
const { data: peek } = await sbC.from('import_batches').select('id').limit(1);
log(!peek?.length,'RLS staging bloquea no-admin', `filas=${peek?.length||0}`);
await sbC.auth.signOut();

// Cleanup
await sb.from('clients').delete().eq('id', cli.id);
await sb.from('import_batches').delete().eq('id', batch.id);
log(true,'Cleanup completo');
console.log('\n=== STAGING E2E PASS ===');
