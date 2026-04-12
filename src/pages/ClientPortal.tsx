import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Search, CheckCircle2, Clock, ArrowLeft, Dumbbell, Loader2, Info, CalendarDays } from 'lucide-react';
import ClassCalendar from '@/components/portal/ClassCalendar';
import logo from '@/assets/conexion-fit-logo.png';
import { getProgramImage } from '@/lib/programImages';
import { realImages } from '@/lib/realImages';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

interface ClientData {
  id: string;
  name: string;
  cedula: string;
  program: string;
  totalClasses: number;
  unitValue: number;
  totalValue: number;
  attendance: { id: string; date: string; classNumber: number }[];
}

const ClientPortal = () => {
  const [cedula, setCedula] = useState('');
  const [foundClients, setFoundClients] = useState<ClientData[]>([]);
  const [activeProgram, setActiveProgram] = useState('');
  const [error, setError] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [success, setSuccess] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!cedula.trim()) return;
    setSearching(true);
    setError('');
    setSuccess('');

    const { data: clientsData, error: err } = await supabase
      .from('clients')
      .select('*')
      .eq('cedula', cedula.trim());

    if (err || !clientsData || clientsData.length === 0) {
      setFoundClients([]);
      setActiveProgram('');
      setError('No se encontró un cliente con esta cédula.');
      setSearching(false);
      return;
    }

    const clientIds = clientsData.map((c: any) => c.id);
    const { data: attData } = await supabase
      .from('attendance')
      .select('*')
      .in('client_id', clientIds)
      .order('class_number');

    const mapped: ClientData[] = clientsData.map((c: any) => ({
      id: c.id,
      name: c.name,
      cedula: c.cedula,
      program: c.program,
      totalClasses: c.total_classes,
      unitValue: c.unit_value,
      totalValue: c.total_value,
      attendance: (attData || [])
        .filter((a: any) => a.client_id === c.id)
        .map((a: any) => ({ id: a.id, date: a.date, classNumber: a.class_number })),
    }));

    setFoundClients(mapped);
    setActiveProgram(mapped[0].id);
    setSearching(false);
  };

  const client = foundClients.find((c) => c.id === activeProgram) || null;

  const handleRegister = async () => {
    if (!client || !date) return;
    if (client.attendance.length >= client.totalClasses) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const alreadyRegistered = client.attendance.some((a) => a.date === dateStr);
    if (alreadyRegistered) {
      setError('Ya se registró asistencia para esta fecha.');
      return;
    }

    const { error: insertErr } = await supabase.from('attendance').insert({
      client_id: client.id,
      date: dateStr,
      class_number: client.attendance.length + 1,
    });

    if (insertErr) {
      setError('Error al registrar. Contacta al administrador.');
      return;
    }

    setFoundClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? { ...c, attendance: [...c.attendance, { id: '', date: dateStr, classNumber: c.attendance.length + 1 }] }
          : c
      )
    );
    setSuccess(`¡Asistencia registrada para el ${format(date, "d 'de' MMMM, yyyy", { locale: es })}!`);
    setError('');
    toast.success('Asistencia registrada');
  };

  const attended = client ? client.attendance.length : 0;
  const remaining = client ? client.totalClasses - attended : 0;
  const progress = client ? (attended / client.totalClasses) * 100 : 0;
  const accumulated = client ? attended * client.unitValue : 0;
  const completed = client ? attended >= client.totalClasses : false;
  const clientName = foundClients.length > 0 ? foundClients[0].name : '';

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 z-0">
        <div className="grid grid-cols-3 grid-rows-2 w-full h-full">
          {realImages.map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-secondary/85 backdrop-blur-[2px]" />
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
            <div className="flex items-center gap-2">
              <Link to="/about">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Info className="h-3.5 w-3.5" /> Info
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="h-3.5 w-3.5" /> Admin
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-6 gap-0.5">
            {realImages.map((img, i) => (
              <div key={i} className="relative overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/90" />
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="text-center">
              {client ? (
                <>
                  <p className="text-primary/90 font-body text-xs uppercase tracking-[0.3em] mb-1">Programa</p>
                  <h2 className="font-display text-5xl text-primary-foreground tracking-widest">{client.program}</h2>
                  <p className="text-primary-foreground/60 font-body text-sm mt-1">Bienvenido/a, {clientName}</p>
                </>
              ) : (
                <>
                  <h2 className="font-display text-4xl text-primary-foreground tracking-widest">PORTAL DEL CLIENTE</h2>
                  <p className="text-primary-foreground/70 font-body text-sm mt-1">Consulta tu progreso y registra tu asistencia</p>
                </>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 container mx-auto px-4 py-8 max-w-lg space-y-6">
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
                <Button onClick={handleSearch} className="gap-2" disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
                </Button>
              </div>
              {error && foundClients.length === 0 && <p className="text-destructive text-sm mt-2 font-body animate-in fade-in">{error}</p>}
            </CardContent>
          </Card>

          {foundClients.length > 0 && (
            <>
              {foundClients.length > 1 && (
                <Tabs value={activeProgram} onValueChange={(v) => { setActiveProgram(v); setSuccess(''); setError(''); }}>
                  <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${foundClients.length}, 1fr)` }}>
                    {foundClients.map((c) => (
                      <TabsTrigger key={c.id} value={c.id} className="text-xs font-body gap-1.5">
                        <Dumbbell className="h-3 w-3" />
                        {c.program}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              {client && (
                <>
                  <Card className={`bg-card/90 backdrop-blur-md shadow-xl border-border/50 transition-all ${completed ? 'ring-2 ring-success/40' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-display text-2xl text-secondary tracking-wide">{clientName}</h2>
                          <p className="text-xs text-muted-foreground font-body">CC: {client.cedula}</p>
                        </div>
                        <Badge variant="outline" className="border-primary/30 text-primary font-body text-xs">{client.program}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-body">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-semibold">{attended} / {client.totalClasses} clases</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

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

                      {attended > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Historial de asistencia</p>
                          <div className="flex flex-wrap gap-1.5">
                            {client.attendance.map((a) => (
                              <span key={a.classNumber} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-body text-muted-foreground">
                                <Dumbbell className="h-3 w-3 text-primary" />
                                Clase {a.classNumber} — {new Date(a.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {completed && (
                        <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-success animate-in fade-in">
                          <CheckCircle2 className="h-5 w-5" />
                          <p className="text-sm font-semibold font-body">¡Felicitaciones! Has completado todas tus clases.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {!completed && (
                    <Card className="bg-card/90 backdrop-blur-md shadow-xl border-border/50">
                      <CardHeader className="pb-2">
                        <h3 className="font-display text-xl text-secondary tracking-wide">REGISTRAR ASISTENCIA</h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground font-body">Selecciona la fecha de tu clase:</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal font-body', !date && 'text-muted-foreground')}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : 'Seleccionar fecha'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn('p-3 pointer-events-auto')} />
                          </PopoverContent>
                        </Popover>
                        <Button onClick={handleRegister} className="w-full gap-2">
                          <CalendarIcon className="h-4 w-4" /> Confirmar Asistencia
                        </Button>
                        {error && foundClients.length > 0 && <p className="text-destructive text-sm font-body animate-in fade-in">{error}</p>}
                        {success && <p className="text-success text-sm font-semibold font-body animate-in fade-in">{success}</p>}
                      </CardContent>
                    </Card>
                  )}

                  {/* Class Calendar */}
                  <ClassCalendar clientCedula={client.cedula} clientName={clientName} />
                </>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-secondary/80 backdrop-blur-md border-t border-border/20 py-4 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p className="text-primary-foreground/40 text-xs font-body">
              © {new Date().getFullYear()} Conexión Fit 360 — 
              <Link to="/about" className="text-primary/60 hover:text-primary ml-1 transition-colors">Acerca de</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ClientPortal;
