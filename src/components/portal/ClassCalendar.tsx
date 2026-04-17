import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, Users, CheckCircle2, AlertCircle, Loader2, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

interface GroupClass {
  id: string;
  title: string;
  program: string;
  instructor: string;
  description: string;
  class_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  confirmed_count: number;
  waitlist_count: number;
}

interface ClassCalendarProps {
  clientCedula: string;
  clientName: string;
}

const programColors: Record<string, string> = {
  FUNCIONAL: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  YOGA: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  PILATEX: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  RUMBA: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
};

const ClassCalendar = ({ clientCedula, clientName }: ClassCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<GroupClass | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [myReservations, setMyReservations] = useState<string[]>([]);
  const [myWaitlists, setMyWaitlists] = useState<string[]>([]);

  const fetchClasses = async () => {
    setLoading(true);
    const { data: classesData } = await supabase.rpc('list_public_classes', {
      _from: format(new Date(), 'yyyy-MM-dd'),
    });

    if (!classesData) { setLoading(false); return; }

    // Fetch counts per class via secure RPC (no exposure of names/cedulas)
    const counts = await Promise.all(
      (classesData as any[]).map(async (c: any) => {
        const { data } = await supabase.rpc('get_class_counts', { _class_id: c.id });
        const row = (data as any[])?.[0];
        return {
          id: c.id,
          confirmed: Number(row?.confirmed_count ?? 0),
          waitlist: Number(row?.waitlist_count ?? 0),
        };
      }),
    );
    const countMap = Object.fromEntries(counts.map((c) => [c.id, c]));

    // Fetch the client's own reservations and waitlist via secure RPCs
    const [{ data: myResData }, { data: myWaitData }] = await Promise.all([
      supabase.rpc('get_reservations_by_cedula', { _cedula: clientCedula }),
      supabase.rpc('get_waitlist_by_cedula', { _cedula: clientCedula }),
    ]);

    setMyReservations(((myResData as any[]) || [])
      .filter((r: any) => r.status === 'confirmed')
      .map((r: any) => r.class_id));
    setMyWaitlists(((myWaitData as any[]) || []).map((w: any) => w.class_id));

    setClasses((classesData as any[]).map((c: any) => ({
      ...c,
      confirmed_count: countMap[c.id]?.confirmed ?? 0,
      waitlist_count: countMap[c.id]?.waitlist ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, [clientCedula]);

  const dailyClasses = classes.filter(c => isSameDay(new Date(c.class_date + 'T12:00:00'), selectedDate));

  const classDates = [...new Set(classes.map(c => c.class_date))];

  const handleBook = async (gc: GroupClass) => {
    setBooking(true);
    const isFull = gc.confirmed_count >= gc.max_capacity;

    if (isFull) {
      const { error } = await supabase.rpc('join_waitlist', {
        _class_id: gc.id,
        _cedula: clientCedula,
      });
      if (error) {
        toast.error(error.message || 'Error al unirse a la lista de espera');
      } else {
        toast.success('Te has unido a la lista de espera');
      }
    } else {
      const { error } = await supabase.rpc('create_reservation', {
        _class_id: gc.id,
        _cedula: clientCedula,
      });
      if (error) {
        toast.error(error.message || 'Error al reservar');
      } else {
        toast.success('¡Reserva confirmada!');
      }
    }

    setBooking(false);
    setDialogOpen(false);
    fetchClasses();
  };

  const openClassDetail = (gc: GroupClass) => {
    setSelectedClass(gc);
    setDialogOpen(true);
  };

  const spotsLeft = (gc: GroupClass) => gc.max_capacity - gc.confirmed_count;
  const isFull = (gc: GroupClass) => gc.confirmed_count >= gc.max_capacity;
  const isBooked = (classId: string) => myReservations.includes(classId);
  const isOnWaitlist = (classId: string) => myWaitlists.includes(classId);

  return (
    <>
      <Card className="bg-card/90 backdrop-blur-md shadow-xl border-border/50">
        <CardHeader className="pb-2">
          <h3 className="font-display text-xl text-secondary tracking-wide flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            CALENDARIO DE CLASES
          </h3>
          <p className="text-xs text-muted-foreground font-body">Selecciona un día para ver las clases disponibles</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            className={cn('p-3 pointer-events-auto rounded-xl border border-border/30')}
            modifiers={{
              hasClass: classDates.map(d => new Date(d + 'T12:00:00')),
            }}
            modifiersClassNames={{
              hasClass: 'bg-primary/20 font-bold text-primary',
            }}
          />

          <div className="space-y-2">
            <p className="text-sm font-semibold font-body text-muted-foreground">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : dailyClasses.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body py-4 text-center">No hay clases programadas para este día</p>
            ) : (
              <div className="space-y-2">
                {dailyClasses.map(gc => (
                  <button
                    key={gc.id}
                    onClick={() => openClassDetail(gc)}
                    className="w-full text-left rounded-xl border border-border/40 p-3 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm font-body">{gc.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                          <Clock className="h-3 w-3" />
                          {gc.start_time.slice(0, 5)} - {gc.end_time.slice(0, 5)}
                          <span className="mx-1">·</span>
                          {gc.instructor}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={cn('text-[10px]', programColors[gc.program] || '')}>
                          {gc.program}
                        </Badge>
                        {isBooked(gc.id) ? (
                          <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Reservado
                          </span>
                        ) : isOnWaitlist(gc.id) ? (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> En espera
                          </span>
                        ) : isFull(gc) ? (
                          <span className="text-[10px] text-destructive font-semibold">Lleno</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {spotsLeft(gc)} cupos
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wide">{selectedClass.title}</DialogTitle>
                <DialogDescription className="font-body">
                  {selectedClass.description || 'Clase grupal'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fecha</p>
                    <p className="font-semibold">{format(new Date(selectedClass.class_date + 'T12:00:00'), "d MMM yyyy", { locale: es })}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Horario</p>
                    <p className="font-semibold">{selectedClass.start_time.slice(0, 5)} - {selectedClass.end_time.slice(0, 5)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Instructor</p>
                    <p className="font-semibold">{selectedClass.instructor}</p>
                  </div>
                  <div className="rounded-lg bg-accent p-2.5 text-center">
                    <p className="text-[10px] text-accent-foreground uppercase tracking-wider">Cupos</p>
                    <p className="font-semibold text-accent-foreground">
                      {selectedClass.confirmed_count}/{selectedClass.max_capacity}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className={cn('text-xs', programColors[selectedClass.program] || '')}>
                  {selectedClass.program}
                </Badge>

                {selectedClass.waitlist_count > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 font-body">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {selectedClass.waitlist_count} persona(s) en lista de espera
                  </div>
                )}
              </div>
              <DialogFooter>
                {isBooked(selectedClass.id) ? (
                  <div className="flex items-center gap-2 text-success text-sm font-semibold font-body w-full justify-center">
                    <CheckCircle2 className="h-4 w-4" /> Ya tienes reserva para esta clase
                  </div>
                ) : isOnWaitlist(selectedClass.id) ? (
                  <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold font-body w-full justify-center">
                    <Clock className="h-4 w-4" /> Ya estás en lista de espera
                  </div>
                ) : (
                  <Button onClick={() => handleBook(selectedClass)} disabled={booking} className="w-full gap-2">
                    {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : isFull(selectedClass) ? (
                      <><AlertCircle className="h-4 w-4" /> Unirse a Lista de Espera</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Reservar Cupo</>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClassCalendar;
