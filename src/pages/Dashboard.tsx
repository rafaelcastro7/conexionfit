import { useMemo, useState } from 'react';
import { Client } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, TrendingUp, Users, DollarSign, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DateRange } from 'react-day-picker';
import Header from '@/components/Header';
import { useClients } from '@/hooks/useClients';
import { realImages } from '@/lib/realImages';

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

const PROGRAM_COLORS = [
  'hsl(22, 90%, 52%)',
  'hsl(220, 15%, 25%)',
  'hsl(142, 70%, 40%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(45, 90%, 50%)',
  'hsl(350, 70%, 50%)',
  'hsl(170, 60%, 45%)',
];

const Dashboard = () => {
  const { clients, loading } = useClients();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filteredData = useMemo(() => {
    return clients.map((client) => {
      const filteredAttendance = client.attendance.filter((a) => {
        if (!dateRange?.from) return true;
        const d = parseISO(a.date);
        return isWithinInterval(d, {
          start: dateRange.from,
          end: dateRange.to || dateRange.from,
        });
      });
      return { ...client, filteredAttendance };
    });
  }, [clients, dateRange]);

  const programStats = useMemo(() => {
    const stats: Record<string, { program: string; clients: number; totalBilled: number; totalAttendance: number; totalClasses: number }> = {};
    filteredData.forEach((c) => {
      if (!stats[c.program]) {
        stats[c.program] = { program: c.program, clients: 0, totalBilled: 0, totalAttendance: 0, totalClasses: 0 };
      }
      stats[c.program].clients += 1;
      stats[c.program].totalBilled += c.filteredAttendance.length * c.unitValue;
      stats[c.program].totalAttendance += c.filteredAttendance.length;
      stats[c.program].totalClasses += c.totalClasses;
    });
    return Object.values(stats).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [filteredData]);

  const totalBilled = programStats.reduce((s, p) => s + p.totalBilled, 0);
  const totalAttendance = filteredData.reduce((s, c) => s + c.filteredAttendance.length, 0);
  const totalClientsActive = filteredData.filter((c) => c.filteredAttendance.length > 0).length;

  const chartData = programStats.map((p, i) => ({
    name: p.program,
    facturado: p.totalBilled,
    fill: PROGRAM_COLORS[i % PROGRAM_COLORS.length],
  }));

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "d MMM", { locale: es })} - ${format(dateRange.to, "d MMM yyyy", { locale: es })}`
      : format(dateRange.from, "d MMM yyyy", { locale: es })
    : 'Seleccionar rango';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative h-32 overflow-hidden">
        <img src={realImages[2]} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-secondary/70 to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-2xl text-primary-foreground tracking-[0.3em] opacity-80">ADMINISTRACIÓN</p>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-secondary tracking-wider">DASHBOARD</h2>
            <p className="text-sm text-muted-foreground font-body">Estadísticas de facturación y avance de clientes</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('justify-start text-left font-normal font-body gap-2 min-w-[260px]')}>
                <CalendarIcon className="h-4 w-4" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} initialFocus className={cn('p-3 pointer-events-auto')} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Facturación Total</p>
                  <p className="text-2xl font-bold font-body">{formatCurrency(totalBilled)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Asistencias</p>
                  <p className="text-2xl font-bold font-body">{totalAttendance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Clientes Activos</p>
                  <p className="text-2xl font-bold font-body">{totalClientsActive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-xl text-secondary tracking-wide flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> FACTURACIÓN POR PROGRAMA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Facturado']} contentStyle={{ borderRadius: '8px', fontFamily: 'Inter', fontSize: 12 }} />
                    <Bar dataKey="facturado" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12 font-body">Sin datos en el rango seleccionado</p>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display text-lg text-secondary tracking-wide">RESUMEN POR PROGRAMA</h3>
            {programStats.map((p, i) => (
              <Card key={p.program} className="overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: PROGRAM_COLORS[i % PROGRAM_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-body font-semibold text-sm">{p.program}</p>
                      <Badge variant="outline" className="text-xs font-body">{p.clients} clientes</Badge>
                    </div>
                    <p className="text-lg font-bold font-body text-primary">{formatCurrency(p.totalBilled)}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{p.totalAttendance} asistencias en el período</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-xl text-secondary tracking-wide flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> LISTADO DE CLIENTES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body text-xs">NOMBRE</TableHead>
                    <TableHead className="font-body text-xs">CÉDULA</TableHead>
                    <TableHead className="font-body text-xs">PROGRAMA</TableHead>
                    <TableHead className="font-body text-xs text-center">AVANCE</TableHead>
                    <TableHead className="font-body text-xs text-right">ASIST. PERÍODO</TableHead>
                    <TableHead className="font-body text-xs text-right">FACTURADO PERÍODO</TableHead>
                    <TableHead className="font-body text-xs text-right">VALOR TOTAL</TableHead>
                    <TableHead className="font-body text-xs text-center">ESTADO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((c) => {
                    const totalAttended = c.attendance.length;
                    const pct = (totalAttended / c.totalClasses) * 100;
                    const periodBilled = c.filteredAttendance.length * c.unitValue;
                    const done = totalAttended >= c.totalClasses;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-body font-medium text-sm">{c.name}</TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">{c.cedula}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-body border-primary/30 text-primary">{c.program}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs font-body text-muted-foreground whitespace-nowrap">{totalAttended}/{c.totalClasses}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-body text-sm">{c.filteredAttendance.length}</TableCell>
                        <TableCell className="text-right font-body text-sm font-semibold">{formatCurrency(periodBilled)}</TableCell>
                        <TableCell className="text-right font-body text-sm">{formatCurrency(c.totalValue)}</TableCell>
                        <TableCell className="text-center">
                          {done ? (
                            <Badge className="bg-success text-success-foreground gap-1 text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> Completado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-body">En curso</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
