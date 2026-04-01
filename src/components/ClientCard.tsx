import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Trash2, CheckCircle2, Layers } from 'lucide-react';

interface Props {
  client: Client;
  onRegister: (id: string) => void;
  onDelete: (id: string) => void;
  otherPrograms?: string[];
}

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

const ClientCard = ({ client, onRegister, onDelete, otherPrograms = [] }: Props) => {
  const attended = client.attendance.length;
  const progress = (attended / client.totalClasses) * 100;
  const accumulated = attended * client.unitValue;
  const completed = attended >= client.totalClasses;

  return (
    <Card className={`transition-all hover:shadow-md ${completed ? 'ring-2 ring-success/40' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl text-secondary tracking-wide">{client.name}</h3>
            <p className="text-xs text-muted-foreground font-body">CC: {client.cedula}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary font-body text-xs">
              {client.program}
            </Badge>
            {completed && (
              <Badge className="bg-success text-success-foreground gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completado
              </Badge>
            )}
          </div>
        </div>
        {/* Multi-program indicator */}
        {otherPrograms.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">También en:</span>
            {otherPrograms.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px] font-body py-0 px-1.5">
                {p}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-body">
            <span className="text-muted-foreground">Asistencia</span>
            <span className="font-semibold">{attended} / {client.totalClasses} clases</span>
          </div>
          <Progress value={progress} className="h-2.5" />
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

        {/* Attendance dates */}
        {attended > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Fechas de asistencia</p>
            <div className="flex flex-wrap gap-1.5">
              {client.attendance.map((a) => (
                <span
                  key={a.classNumber}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-body text-muted-foreground"
                >
                  {new Date(a.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => onRegister(client.id)}
            disabled={completed}
            className="flex-1 gap-2"
            size="sm"
          >
            <CalendarCheck className="h-4 w-4" />
            Registrar Asistencia
          </Button>
          <Button
            onClick={() => onDelete(client.id)}
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
