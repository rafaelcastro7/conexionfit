import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Pencil, Trash2, CalendarIcon, Clock, Users, Loader2, Dumbbell, ListChecks, Repeat, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import ReservationManager from './ReservationManager';
import ClassQRDialog from './ClassQRDialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface GroupClass {
  id: string;
  title: string;
  program: string;
  instructor: string;
  description: string | null;
  class_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_recurring?: boolean;
  recurrence_group_id?: string | null;
  checkin_token?: string;
}

const PROGRAMS = ['FUNCIONAL', 'YOGA', 'PILATEX', 'RUMBA', 'SPINNING', 'BOXEO', 'ZUMBA'];

const emptyForm = {
  title: '',
  program: 'FUNCIONAL',
  instructor: '',
  description: '',
  class_date: '',
  start_time: '',
  end_time: '',
  max_capacity: 20,
  is_recurring: false,
  recurrence_weeks: 4,
};

const GroupClassManager = () => {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<GroupClass | null>(null);
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [reservationClassId, setReservationClassId] = useState<string | null>(null);
  const [qrClass, setQrClass] = useState<GroupClass | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('group_classes')
      .select('*')
      .order('class_date', { ascending: false })
      .order('start_time');

    if (data) {
      setClasses(data);
      const ids = data.map(c => c.id);
      if (ids.length > 0) {
        const { data: resData } = await supabase
          .from('reservations')
          .select('class_id')
          .in('class_id', ids)
          .eq('status', 'confirmed');
        const counts: Record<string, number> = {};
        (resData || []).forEach(r => { counts[r.class_id] = (counts[r.class_id] || 0) + 1; });
        setReservationCounts(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (gc: GroupClass) => {
    setEditingId(gc.id);
    setForm({
      title: gc.title,
      program: gc.program,
      instructor: gc.instructor,
      description: gc.description || '',
      class_date: gc.class_date,
      start_time: gc.start_time.slice(0, 5),
      end_time: gc.end_time.slice(0, 5),
      max_capacity: gc.max_capacity,
      is_recurring: false,
      recurrence_weeks: 4,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.class_date || !form.start_time || !form.end_time) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setSaving(true);

    const basePayload = {
      title: form.title,
      program: form.program,
      instructor: form.instructor,
      description: form.description || null,
      start_time: form.start_time,
      end_time: form.end_time,
      max_capacity: form.max_capacity,
    };

    if (editingId) {
      const { error } = await supabase
        .from('group_classes')
        .update({ ...basePayload, class_date: form.class_date })
        .eq('id', editingId);
      if (error) toast.error('Error al actualizar');
      else toast.success('Clase actualizada');
    } else if (form.is_recurring && form.recurrence_weeks > 1) {
      // Generate N weekly occurrences
      const groupId = crypto.randomUUID();
      const baseDate = new Date(form.class_date + 'T12:00:00');
      const rows = Array.from({ length: form.recurrence_weeks }).map((_, i) => {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i * 7);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return {
          ...basePayload,
          class_date: `${yyyy}-${mm}-${dd}`,
          is_recurring: true,
          recurrence_group_id: groupId,
        };
      });
      const { error } = await supabase.from('group_classes').insert(rows);
      if (error) toast.error('Error al crear las clases recurrentes');
      else toast.success(`${form.recurrence_weeks} clases recurrentes creadas`);
    } else {
      const { error } = await supabase
        .from('group_classes')
        .insert({ ...basePayload, class_date: form.class_date });
      if (error) toast.error('Error al crear clase');
      else toast.success('Clase creada');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchClasses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('group_classes').delete().eq('id', id);
    if (error) toast.error('Error al eliminar');
    else {
      toast.success('Clase eliminada');
      fetchClasses();
    }
  };

  const handleDeleteSeries = async (recurrenceGroupId: string, fromDate: string) => {
    const { error } = await supabase
      .from('group_classes')
      .delete()
      .eq('recurrence_group_id', recurrenceGroupId)
      .gte('class_date', fromDate);
    if (error) toast.error('Error al eliminar la serie');
    else {
      toast.success('Serie recurrente eliminada');
      fetchClasses();
    }
  };

  const updateField = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl text-secondary tracking-wide flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> CLASES GRUPALES
          </CardTitle>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva Clase
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : classes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-body">No hay clases programadas</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body text-xs">CLASE</TableHead>
                  <TableHead className="font-body text-xs">PROGRAMA</TableHead>
                  <TableHead className="font-body text-xs">FECHA</TableHead>
                  <TableHead className="font-body text-xs">HORARIO</TableHead>
                  <TableHead className="font-body text-xs">INSTRUCTOR</TableHead>
                  <TableHead className="font-body text-xs text-center">CUPOS</TableHead>
                  <TableHead className="font-body text-xs text-right">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map(gc => {
                  const reserved = reservationCounts[gc.id] || 0;
                  return (
                    <TableRow key={gc.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-body font-medium text-sm">
                        <div className="flex items-center gap-1.5">
                          {gc.title}
                          {gc.recurrence_group_id && (
                            <Repeat className="h-3 w-3 text-primary" aria-label="Clase recurrente" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-body border-primary/30 text-primary">
                          {gc.program}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {format(new Date(gc.class_date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {gc.start_time.slice(0, 5)} - {gc.end_time.slice(0, 5)}
                      </TableCell>
                      <TableCell className="font-body text-sm">{gc.instructor}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={reserved >= gc.max_capacity ? 'destructive' : 'outline'} className="text-xs font-body">
                          {reserved}/{gc.max_capacity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver reservas" onClick={() => setReservationClassId(gc.id)}>
                            <ListChecks className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(gc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar clase?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará "{gc.title}" del {format(new Date(gc.class_date + 'T12:00:00'), "d MMM yyyy", { locale: es })} y sus reservas asociadas.
                                  {gc.recurrence_group_id && ' Esta clase es parte de una serie recurrente.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                {gc.recurrence_group_id && (
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSeries(gc.recurrence_group_id!, gc.class_date)}
                                    className="bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                                  >
                                    Eliminar serie futura
                                  </AlertDialogAction>
                                )}
                                <AlertDialogAction onClick={() => handleDelete(gc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Solo esta clase
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">
              {editingId ? 'Editar Clase' : 'Nueva Clase Grupal'}
            </DialogTitle>
            <DialogDescription className="font-body">
              {editingId ? 'Modifica los datos de la clase' : 'Programa una nueva clase grupal'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-body text-xs">Título *</Label>
              <Input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Ej: Funcional Intenso" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Programa *</Label>
                <Select value={form.program} onValueChange={v => updateField('program', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Instructor</Label>
                <Input value={form.instructor} onChange={e => updateField('instructor', e.target.value)} placeholder="Nombre" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-body text-xs">Fecha *</Label>
              <Input type="date" value={form.class_date} onChange={e => updateField('class_date', e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Inicio *</Label>
                <Input type="time" value={form.start_time} onChange={e => updateField('start_time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Fin *</Label>
                <Input type="time" value={form.end_time} onChange={e => updateField('end_time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Cupo máx.</Label>
                <Input type="number" min={1} value={form.max_capacity} onChange={e => updateField('max_capacity', parseInt(e.target.value) || 1)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-body text-xs">Descripción</Label>
              <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Opcional" rows={2} />
            </div>

            {!editingId && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-body text-xs flex items-center gap-1.5 cursor-pointer">
                    <Repeat className="h-3.5 w-3.5 text-primary" /> Clase recurrente (semanal)
                  </Label>
                  <Switch
                    checked={form.is_recurring}
                    onCheckedChange={(v) => setForm(f => ({ ...f, is_recurring: v }))}
                  />
                </div>
                {form.is_recurring && (
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs text-muted-foreground">
                      Repetir durante (semanas)
                    </Label>
                    <Input
                      type="number"
                      min={2}
                      max={52}
                      value={form.recurrence_weeks}
                      onChange={e => setForm(f => ({ ...f, recurrence_weeks: Math.max(2, Math.min(52, parseInt(e.target.value) || 2)) }))}
                    />
                    <p className="text-[10px] text-muted-foreground font-body">
                      Se crearán {form.recurrence_weeks} clases, una por semana en el mismo día y horario.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Guardar Cambios' : 'Crear Clase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Manager */}
      {reservationClassId && (() => {
        const gc = classes.find(c => c.id === reservationClassId);
        if (!gc) return null;
        return (
          <ReservationManager
            classId={gc.id}
            classTitle={gc.title}
            classDate={gc.class_date}
            maxCapacity={gc.max_capacity}
            open={true}
            onOpenChange={(o) => { if (!o) setReservationClassId(null); }}
            onReservationChange={fetchClasses}
          />
        );
      })()}
    </Card>
  );
};

export default GroupClassManager;
