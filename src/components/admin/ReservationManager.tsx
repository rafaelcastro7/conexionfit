import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserX, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reservation {
  id: string;
  client_name: string;
  client_cedula: string;
  status: string;
  created_at: string;
}

interface WaitlistEntry {
  id: string;
  client_name: string;
  client_cedula: string;
  position: number;
  created_at: string;
}

interface ReservationManagerProps {
  classId: string;
  classTitle: string;
  classDate: string;
  maxCapacity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReservationChange: () => void;
}

const ReservationManager = ({
  classId, classTitle, classDate, maxCapacity, open, onOpenChange, onReservationChange,
}: ReservationManagerProps) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string; type: 'reservation' | 'waitlist' } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [resResult, wlResult] = await Promise.all([
      supabase.from('reservations').select('*').eq('class_id', classId).eq('status', 'confirmed').order('created_at'),
      supabase.from('waitlist').select('*').eq('class_id', classId).order('position'),
    ]);
    setReservations(resResult.data || []);
    setWaitlist(wlResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchData();
  }, [open, classId]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);

    if (cancelTarget.type === 'reservation') {
      const { error } = await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', cancelTarget.id);
      if (error) {
        toast.error('Error al cancelar reserva');
      } else {
        toast.success(`Reserva de ${cancelTarget.name} cancelada`);
        // Auto-promote first waitlist entry
        if (waitlist.length > 0) {
          const next = waitlist[0];
          const { error: promoteError } = await supabase.from('reservations').insert({
            class_id: classId,
            client_name: next.client_name,
            client_cedula: next.client_cedula,
            status: 'confirmed',
          });
          if (!promoteError) {
            await supabase.from('waitlist').delete().eq('id', next.id);
            toast.info(`${next.client_name} promovido desde lista de espera`);
          }
        }
      }
    } else {
      const { error } = await supabase.from('waitlist').delete().eq('id', cancelTarget.id);
      if (error) toast.error('Error al eliminar de lista de espera');
      else toast.success(`${cancelTarget.name} eliminado de lista de espera`);
    }

    setCancelling(false);
    setCancelTarget(null);
    fetchData();
    onReservationChange();
  };

  const confirmedCount = reservations.length;
  const formattedDate = (() => {
    try { return format(new Date(classDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }); }
    catch { return classDate; }
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> {classTitle}
            </DialogTitle>
            <DialogDescription className="font-body">
              {formattedDate} · Cupo: {confirmedCount}/{maxCapacity}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Confirmed reservations */}
              <div>
                <h4 className="font-body text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Badge className="bg-success text-success-foreground text-xs">{confirmedCount}</Badge>
                  Reservas Confirmadas
                </h4>
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body py-2">No hay reservas</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-body text-xs">CLIENTE</TableHead>
                        <TableHead className="font-body text-xs">CÉDULA</TableHead>
                        <TableHead className="font-body text-xs text-right">ACCIÓN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map(r => (
                        <TableRow key={r.id} className="hover:bg-muted/50">
                          <TableCell className="font-body text-sm font-medium">{r.client_name}</TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">{r.client_cedula}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive gap-1 text-xs h-7"
                              onClick={() => setCancelTarget({ id: r.id, name: r.client_name, type: 'reservation' })}
                            >
                              <UserX className="h-3.5 w-3.5" /> Cancelar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Waitlist */}
              <div>
                <h4 className="font-body text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">{waitlist.length}</Badge>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Lista de Espera
                </h4>
                {waitlist.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body py-2">Lista de espera vacía</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-body text-xs w-12">#</TableHead>
                        <TableHead className="font-body text-xs">CLIENTE</TableHead>
                        <TableHead className="font-body text-xs">CÉDULA</TableHead>
                        <TableHead className="font-body text-xs text-right">ACCIÓN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlist.map(w => (
                        <TableRow key={w.id} className="hover:bg-muted/50">
                          <TableCell className="font-body text-sm text-muted-foreground">{w.position}</TableCell>
                          <TableCell className="font-body text-sm font-medium">{w.client_name}</TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">{w.client_cedula}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive gap-1 text-xs h-7"
                              onClick={() => setCancelTarget({ id: w.id, name: w.client_name, type: 'waitlist' })}
                            >
                              <UserX className="h-3.5 w-3.5" /> Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cancelTarget?.type === 'reservation' ? '¿Cancelar reserva?' : '¿Quitar de lista de espera?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.type === 'reservation'
                ? `Se cancelará la reserva de "${cancelTarget?.name}" para esta clase. ${waitlist.length > 0 ? 'El siguiente en la lista de espera será promovido automáticamente.' : ''}`
                : `Se eliminará a "${cancelTarget?.name}" de la lista de espera.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReservationManager;
