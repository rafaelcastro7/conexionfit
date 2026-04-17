import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CalendarClock, Flame, PartyPopper } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SmartAlertsProps {
  clientCedula: string;
  attendance: { date: string }[];
  totalClasses: number;
}

interface UpcomingReservation {
  class_id: string;
  group_classes: {
    title: string;
    class_date: string;
    start_time: string;
  } | null;
}

type AlertItem = {
  id: string;
  tone: 'warning' | 'info' | 'success';
  icon: typeof AlertTriangle;
  title: string;
  message: string;
};

const toneStyles: Record<AlertItem['tone'], string> = {
  warning: 'bg-destructive/10 border-destructive/30 text-destructive',
  info: 'bg-primary/10 border-primary/30 text-primary',
  success: 'bg-success/10 border-success/30 text-success',
};

const SmartAlerts = ({ clientCedula, attendance, totalClasses }: SmartAlertsProps) => {
  const [upcoming, setUpcoming] = useState<UpcomingReservation[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('reservations')
        .select('class_id, group_classes(title, class_date, start_time)')
        .eq('client_cedula', clientCedula)
        .eq('status', 'confirmed');
      if (cancelled || !data) return;
      const future = (data as any[])
        .filter((r) => r.group_classes && r.group_classes.class_date >= today)
        .sort((a, b) =>
          (a.group_classes.class_date + a.group_classes.start_time).localeCompare(
            b.group_classes.class_date + b.group_classes.start_time,
          ),
        );
      setUpcoming(future);
    })();
    return () => { cancelled = true; };
  }, [clientCedula]);

  const alerts: AlertItem[] = [];

  // 1. Upcoming reservation
  const next = upcoming[0];
  if (next?.group_classes) {
    const diff = differenceInDays(parseISO(next.group_classes.class_date), new Date());
    const when =
      diff <= 0
        ? 'hoy'
        : diff === 1
        ? 'mañana'
        : `en ${diff} días`;
    alerts.push({
      id: 'next-reservation',
      tone: 'info',
      icon: CalendarClock,
      title: `Próxima clase ${when}`,
      message: `${next.group_classes.title} · ${format(
        parseISO(next.group_classes.class_date),
        "EEEE d 'de' MMM",
        { locale: es },
      )} a las ${next.group_classes.start_time.slice(0, 5)}`,
    });
  }

  // 2. Few classes left
  const remaining = totalClasses - attendance.length;
  if (remaining > 0 && remaining <= 2) {
    alerts.push({
      id: 'low-classes',
      tone: 'warning',
      icon: AlertTriangle,
      title: remaining === 1 ? '¡Solo te queda 1 clase!' : `Te quedan ${remaining} clases`,
      message: 'Renueva tu paquete pronto para no interrumpir tu progreso.',
    });
  }

  // 3. Inactivity
  if (attendance.length > 0) {
    const lastDate = attendance
      .map((a) => parseISO(a.date))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const daysSince = differenceInDays(new Date(), lastDate);
    if (daysSince >= 5 && remaining > 0) {
      alerts.push({
        id: 'inactivity',
        tone: 'warning',
        icon: Flame,
        title: `Hace ${daysSince} días sin entrenar`,
        message: '¡Vuelve hoy y mantén el ritmo! Tu cuerpo te lo agradecerá.',
      });
    }
  }

  // 4. Completed congratulations
  if (totalClasses > 0 && attendance.length >= totalClasses) {
    alerts.push({
      id: 'completed',
      tone: 'success',
      icon: PartyPopper,
      title: '¡Paquete completado!',
      message: 'Renueva para seguir disfrutando de tus clases favoritas.',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const Icon = a.icon;
        return (
          <div
            key={a.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border backdrop-blur-md p-3 shadow-md animate-in fade-in slide-in-from-top-2',
              toneStyles[a.tone],
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold font-body leading-tight">{a.title}</p>
              <p className="text-xs font-body opacity-90 mt-0.5">{a.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SmartAlerts;
