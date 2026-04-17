import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, QrCode, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ClassInfo {
  id: string;
  title: string;
  program: string;
  instructor: string;
  class_date: string;
  start_time: string;
  end_time: string;
}

type Status = 'loading' | 'invalid' | 'ready' | 'success' | 'error';

const CheckIn = () => {
  const { token } = useParams<{ token: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [cedula, setCedula] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('group_classes')
        .select('id, title, program, instructor, class_date, start_time, end_time')
        .eq('checkin_token', token)
        .maybeSingle();
      if (error || !data) {
        setStatus('invalid');
        return;
      }
      setClassInfo(data);
      setStatus('ready');
    })();
  }, [token]);

  const handleCheckIn = async () => {
    if (!cedula.trim() || !classInfo) {
      toast.error('Ingresa tu número de cédula');
      return;
    }
    setSubmitting(true);

    // 1. Find client
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, total_classes')
      .eq('cedula', cedula.trim())
      .maybeSingle();

    if (!client) {
      setStatus('error');
      setResultMessage('No encontramos un cliente con esa cédula. Verifica con recepción.');
      setSubmitting(false);
      return;
    }

    setClientName(client.name);

    // 2. Check if already checked in today for this class date
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, class_number')
      .eq('client_id', client.id)
      .eq('date', classInfo.class_date);

    if (existing && existing.length > 0) {
      setStatus('success');
      setResultMessage(`Ya tienes registrada tu asistencia de hoy (${classInfo.title}).`);
      setSubmitting(false);
      return;
    }

    // 3. Compute next class number
    const { count } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id);

    const nextClassNumber = (count || 0) + 1;

    // 4. Insert attendance
    const { error: attErr } = await supabase
      .from('attendance')
      .insert({
        client_id: client.id,
        date: classInfo.class_date,
        class_number: nextClassNumber,
      });

    if (attErr) {
      setStatus('error');
      setResultMessage('No pudimos registrar tu asistencia. Por favor intenta de nuevo.');
      setSubmitting(false);
      return;
    }

    setStatus('success');
    setResultMessage(
      `¡Bienvenido/a ${client.name}! Asistencia registrada (clase ${nextClassNumber} de ${client.total_classes}).`,
    );
    setSubmitting(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center font-display">Código QR inválido</CardTitle>
            <CardDescription className="text-center font-body">
              Este código no corresponde a ninguna clase activa. Pídele a recepción que verifique el QR.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="rounded-full bg-primary/10 p-3">
              <QrCode className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="font-display tracking-wide text-2xl">{classInfo?.title}</CardTitle>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground font-body mt-2">
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {classInfo && format(new Date(classInfo.class_date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {classInfo?.start_time.slice(0, 5)} - {classInfo?.end_time.slice(0, 5)}
            </div>
            {classInfo?.instructor && (
              <div className="flex items-center justify-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {classInfo.instructor}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' ? (
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="font-display text-xl tracking-wide">¡Check-in exitoso!</h3>
              <p className="text-sm text-muted-foreground font-body">{resultMessage}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/">Ir al inicio</Link>
              </Button>
            </div>
          ) : status === 'error' ? (
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <h3 className="font-display text-xl tracking-wide">No se pudo registrar</h3>
              <p className="text-sm text-muted-foreground font-body">{resultMessage}</p>
              <Button onClick={() => { setStatus('ready'); setResultMessage(''); }} variant="outline">
                Intentar de nuevo
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="cedula" className="font-body text-sm">
                  Tu número de cédula
                </Label>
                <Input
                  id="cedula"
                  inputMode="numeric"
                  autoFocus
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ingresa tu cédula"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                  className="text-lg h-12"
                />
              </div>
              <Button
                onClick={handleCheckIn}
                disabled={submitting || !cedula.trim()}
                className="w-full h-12 text-base gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Registrar asistencia
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIn;
