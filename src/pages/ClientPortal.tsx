import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Search, CheckCircle2, Clock, ArrowLeft, Dumbbell } from 'lucide-react';
import logo from '@/assets/conexion-fit-logo.png';
import gymBg1 from '@/assets/gym-bg-1.jpg';
import gymBg2 from '@/assets/gym-bg-2.jpg';
import { Link } from 'react-router-dom';

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

const ClientPortal = () => {
  const { clients, registerAttendanceWithDate } = useClients();
  const [cedula, setCedula] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [success, setSuccess] = useState('');

  const handleSearch = () => {
    const found = clients.find((c) => c.cedula === cedula.trim());
    if (found) {
      setClient(found);
      setError('');
    } else {
      setClient(null);
      setError('No se encontró un cliente con esta cédula.');
    }
    setSuccess('');
  };

  const handleRegister = () => {
    if (!client || !date) return;
    if (client.attendance.length >= client.totalClasses) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const alreadyRegistered = client.attendance.some((a) => a.date === dateStr);
    if (alreadyRegistered) {
      setError('Ya se registró asistencia para esta fecha.');
      return;
    }

    registerAttendanceWithDate(client.id, dateStr);
    // refresh client
    const updated = clients.find((c) => c.id === client.id);
    if (updated) {
      setClient({
        ...updated,
        attendance: [
          ...updated.attendance,
          { date: dateStr, classNumber: updated.attendance.length + 1 },
        ],
      });
    }
    setSuccess(`¡Asistencia registrada para el ${format(date, "d 'de' MMMM, yyyy", { locale: es })}!`);
    setError('');
  };

  const attended = client ? client.attendance.length : 0;
  const remaining = client ? client.totalClasses - attended : 0;
  const progress = client ? (attended / client.totalClasses) * 100 : 0;
  const accumulated = client ? attended * client.unitValue : 0;
  const completed = client ? attended >= client.totalClasses : false;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background images */}
      <div className="fixed inset-0 z-0">
        <img src={gymBg1} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
      <header className="bg-secondary/90 border-b border-border/20 shadow-lg backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Conexion Fit" width={48} height={48} className="rounded-lg bg-card/90 p-1" />
            <div>
              <h1 className="text-2xl text-primary-foreground tracking-wider leading-none">CONEXION FIT</h1>
              <p className="text-[10px] text-primary-foreground/60 font-body tracking-widest uppercase">Portal del Cliente</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero banner with second image */}
      <div className="relative h-40 overflow-hidden">
        <img src={gymBg2} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 to-secondary/90" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="font-display text-4xl text-primary-foreground tracking-widest">PORTAL DEL CLIENTE</h2>
            <p className="text-primary-foreground/70 font-body text-sm mt-1">Consulta tu progreso y registra tu asistencia</p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg space-y-6">
        {/* Search */}
        <Card className="bg-card/90 backdrop-blur-md shadow-xl border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground font-body mb-3">Ingresa tu número de cédula para consultar tu estado:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Número de cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" /> Buscar
              </Button>
            </div>
            {error && !client && <p className="text-destructive text-sm mt-2 font-body">{error}</p>}
          </CardContent>
        </Card>

        {/* Client info */}
        {client && (
          <>
            <Card className={completed ? 'ring-2 ring-success/40' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-2xl text-secondary tracking-wide">{client.name}</h2>
                    <p className="text-xs text-muted-foreground font-body">CC: {client.cedula}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary font-body text-xs">
                    {client.program}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-semibold">{attended} / {client.totalClasses} clases</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-accent p-3">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-[10px] text-accent-foreground uppercase tracking-wider font-body">Tomadas</p>
                      <p className="text-xl font-bold font-body text-accent-foreground">{attended}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Pendientes</p>
                      <p className="text-xl font-bold font-body">{remaining}</p>
                    </div>
                  </div>
                </div>

                {/* Values */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/60 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Unitario</p>
                    <p className="text-sm font-semibold font-body">{formatCurrency(client.unitValue)}</p>
                  </div>
                  <div className="rounded-lg bg-accent p-2.5">
                    <p className="text-[10px] text-accent-foreground uppercase tracking-wider font-body">Acumulado</p>
                    <p className="text-sm font-semibold font-body text-accent-foreground">{formatCurrency(accumulated)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/10 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Total</p>
                    <p className="text-sm font-semibold font-body">{formatCurrency(client.totalValue)}</p>
                  </div>
                </div>

                {/* Attendance history */}
                {attended > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Historial de asistencia</p>
                    <div className="flex flex-wrap gap-1.5">
                      {client.attendance.map((a) => (
                        <span
                          key={a.classNumber}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-body text-muted-foreground"
                        >
                          <Dumbbell className="h-3 w-3 text-primary" />
                          Clase {a.classNumber} — {new Date(a.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {completed && (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-semibold font-body">¡Felicitaciones! Has completado todas tus clases.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Register attendance */}
            {!completed && (
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-display text-xl text-secondary tracking-wide">REGISTRAR ASISTENCIA</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground font-body">Selecciona la fecha de tu clase:</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal font-body',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button onClick={handleRegister} className="w-full gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Confirmar Asistencia
                  </Button>

                  {error && client && <p className="text-destructive text-sm font-body">{error}</p>}
                  {success && <p className="text-success text-sm font-semibold font-body">{success}</p>}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
};

export default ClientPortal;
