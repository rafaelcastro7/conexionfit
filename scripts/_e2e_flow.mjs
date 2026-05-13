import { createClient } from '@supabase/supabase-js';
const URL='https://tycwbzulmsqodojmfuxv.supabase.co';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Y3dienVsbXNxb2Rvam1mdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDkyNTMsImV4cCI6MjA5MDYyNTI1M30.eiC1wtb6YEcAHL6Ivt_taxINwslSY-ugbhXA-uO3Uqs';
const sb = createClient(URL, ANON);

// 1) listar clases publicas
const { data: classes, error: e1 } = await sb.rpc('list_public_classes', { _from: '2026-05-01' });
if (e1) { console.log('❌ list_public_classes', e1.message); process.exit(1); }
const cls = classes[0];
console.log('✅ Clase elegida:', cls.title, cls.class_date, cls.start_time);

// 2) crear reserva con cedula 1234
const { data: rid, error: e2 } = await sb.rpc('create_reservation', { _class_id: cls.id, _cedula: '1234' });
if (e2) console.log('⚠️ create_reservation:', e2.message); else console.log('✅ Reserva:', rid);

// 3) contar
const { data: cnt, error: e3 } = await sb.rpc('get_class_counts', { _class_id: cls.id });
if (e3) console.log('❌ counts', e3.message); else console.log('✅ counts:', JSON.stringify(cnt));

// 4) reservas por cedula
const { data: rsv, error: e4 } = await sb.rpc('get_reservations_by_cedula', { _cedula: '1234' });
if (e4) console.log('❌ rsv', e4.message); else console.log('✅ Reservas cedula 1234:', rsv.length);

// 5) check-in QR — obtener token (admin lo conoce; aquí simulo con login admin)
const sbA = createClient(URL, ANON);
await sbA.auth.signInWithPassword({ email:'admin@conexionfit.com', password:'Admin123!' });
const { data: gc } = await sbA.from('group_classes').select('checkin_token').eq('id', cls.id).single();
console.log('✅ Token QR obtenido:', gc.checkin_token.substring(0,8)+'...');

// 6) check-in publico (cedula 5678 — sin asistencia hoy aún)
const { data: ck, error: e6 } = await sb.rpc('checkin_via_qr', { _token: gc.checkin_token, _cedula: '5678' });
if (e6) console.log('❌ checkin', e6.message); else console.log('✅ Check-in QR:', JSON.stringify(ck));

// 7) verificar asistencia incrementada
const { data: att2 } = await sb.rpc('get_attendance_by_cedula', { _cedula: '5678' });
console.log('✅ Asistencias 5678 ahora:', att2.length);

// limpieza
await sbA.from('attendance').delete().eq('client_id', '22222222-2222-2222-2222-222222222222').gte('class_number', 11);
if (rid) await sbA.from('reservations').delete().eq('id', rid);
console.log('✅ Cleanup');
