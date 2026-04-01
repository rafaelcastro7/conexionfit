import { Client } from '@/types/client';
import { Users, CalendarCheck, DollarSign, Trophy } from 'lucide-react';

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

const StatsBar = ({ clients }: { clients: Client[] }) => {
  const totalClients = clients.length;
  const totalAttendance = clients.reduce((s, c) => s + c.attendance.length, 0);
  const totalRevenue = clients.reduce((s, c) => s + c.attendance.length * c.unitValue, 0);
  const completed = clients.filter((c) => c.attendance.length >= c.totalClasses).length;

  const stats = [
    { icon: Users, label: 'Clientes', value: totalClients },
    { icon: CalendarCheck, label: 'Asistencias', value: totalAttendance },
    { icon: DollarSign, label: 'Recaudo', value: formatCurrency(totalRevenue) },
    { icon: Trophy, label: 'Completados', value: completed },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <s.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            <p className="text-lg font-semibold font-body leading-tight">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
