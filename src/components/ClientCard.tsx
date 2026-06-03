import { Client } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Trash2, CheckCircle2, Layers, Lock, Unlock } from 'lucide-react';

interface Props {
  client: Client;
  onRegister: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (cedula: string, next: 'active' | 'inactive') => void;
  otherPrograms?: string[];
  canRegister?: boolean;
  canDelete?: boolean;
  canToggleStatus?: boolean;
}

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

const ClientCard = ({ client, onRegister, onDelete, onToggleStatus, otherPrograms = [], canRegister = true, canDelete = true, canToggleStatus = false }: Props) => {
  const attended = client.attendance.length;
  const progress = (attended / client.totalClasses) * 100;
  const accumulated = attended * client.unitValue;
  const completed = attended >= client.totalClasses;
  const isInactive = client.status === 'inactive';

  return (
    <Card className={`transition-all hover:shadow-md ${completed ? 'ring-2 ring-success/40' : ''} ${isInactive ? 'opacity-70 ring-2 ring-destructive/40' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl text-secondary tracking-wide">{client.name}</h3>
            <p className="text-xs text-muted-foreground font-body">
              <span className="font-mono font-semibold text-secondary">{client.codigo || '—'}</span>
              <span className="mx-1.5 opacity-50">·</span>
              CC: {client.cedula}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="border-primary/30 text-primary font-body text-xs">
              {client.program}
            </Badge>
            {isInactive && (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <Lock className="h-3 w-3" /> Inactivo
              </Badge>
            )}
            {completed && (
              <Badge className="bg-success text-success-foreground gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completado
              </Badge>
            )}
          </div>
        </div>
        {otherPrograms.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">También en:</span>
            {otherPrograms.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px] font-body py-0 px-1.5">{p}</Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-body">
            <span className="text-muted-foreground">Asistencia</span>
            <span className="font-semibold">{attended} / {client.totalClasses} clases</span>
          </div>
          <Progress value={progress} className="h-2.5" />
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
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Fechas de asistencia</p>
            <div className="flex flex-wrap gap-1.5">
              {client.attendance.map((a) => {
                const tip = [a.sessionTime, a.notes].filter(Boolean).join(' · ');
                return (
                <span
                  key={a.classNumber}
                  title={tip || undefined}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-body text-muted-foreground"
                >
                  {new Date(a.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  {a.notes ? <span className="ml-1 text-[10px] opacity-80">({a.notes})</span> : null}
                </span>
              );})}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {canRegister && (
            <Button onClick={() => onRegister(client.id)} disabled={completed || isInactive} className="flex-1 gap-2" size="sm">
              <CalendarCheck className="h-4 w-4" /> Registrar Asistencia
            </Button>
          )}
          {canToggleStatus && onToggleStatus && (
            <Button
              onClick={() => onToggleStatus(client.cedula, isInactive ? 'active' : 'inactive')}
              variant="outline"
              size="sm"
              title={isInactive ? 'Reactivar código' : 'Bloquear código (inactivar)'}
              className={isInactive ? 'text-success hover:bg-success hover:text-success-foreground' : 'text-warning hover:bg-warning hover:text-warning-foreground'}
            >
              {isInactive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </Button>
          )}
          {canDelete && (
            <Button
              onClick={() => onDelete(client.id)}
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
