import { createClient } from '@supabase/supabase-js';
const URL='https://tycwbzulmsqodojmfuxv.supabase.co';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Y3dienVsbXNxb2Rvam1mdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDkyNTMsImV4cCI6MjA5MDYyNTI1M30.eiC1wtb6YEcAHL6Ivt_taxINwslSY-ugbhXA-uO3Uqs';
const sb = createClient(URL, ANON);
const sbA = createClient(URL, ANON);
await sbA.auth.signInWithPassword({ email:'admin@conexionfit.com', password:'Admin123!' });

const log=(ok,n,d='')=>console.log(ok?'✅':'❌', n, d);

const { data: classes } = await sb.rpc('list_public_classes', { _from: '2026-05-01' });
const cls = classes[0];
log(true,'Clase elegida', `${cls.title} ${cls.class_date} ${cls.start_time}`);

const { data: rid, error: e2 } = await sb.rpc('create_reservation', { _class_id: cls.id, _cedula: '5678' });
log(!e2,'create_reservation', e2?.message || rid);

const { data: cnt } = await sb.rpc('get_class_counts', { _class_id: cls.id });
log(true,'counts', JSON.stringify(cnt));

const { data: rsv } = await sb.rpc('get_reservations_by_cedula', { _cedula: '5678' });
log(true,'Reservas 5678', rsv.length);

const { data: gc } = await sbA.from('group_classes').select('checkin_token').eq('id', cls.id).single();
log(true,'Token QR', gc.checkin_token.substring(0,8)+'...');

const { data: ck, error: e6 } = await sb.rpc('checkin_via_qr', { _token: gc.checkin_token, _cedula: '5678' });
log(!e6 && ck[0].success, 'Check-in QR', JSON.stringify(ck));

// Doble check-in mismo día → debe rechazar
const { data: ck2 } = await sb.rpc('checkin_via_qr', { _token: gc.checkin_token, _cedula: '5678' });
log(!ck2[0].success && ck2[0].message.includes('hoy'), 'Bloqueo doble check-in', ck2[0].message);

// Cleanup
if (rid) await sbA.from('reservations').delete().eq('id', rid);
const { data: lastAtt } = await sbA.from('attendance').select('id').eq('client_id','22222222-2222-2222-2222-222222222222').order('created_at',{ascending:false}).limit(1);
if (lastAtt?.length) await sbA.from('attendance').delete().eq('id', lastAtt[0].id);
log(true,'Cleanup OK');
