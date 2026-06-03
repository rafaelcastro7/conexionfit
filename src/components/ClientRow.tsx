import { Client } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, HeartPulse, ChevronRight } from 'lucide-react';

interface Props {
  client: Client;
  onClick: () => void;
}

const ClientRow = ({ client, onClick }: Props) => {
  const attended = client.attendance.length;
  const progress = (attended / client.totalClasses) * 100;
  const completed = attended >= client.totalClasses;
  const isInactive = client.status === 'inactive';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border bg-card px-4 py-3 transition-all hover:shadow-md hover:border-primary/40 flex items-center gap-4 ${
        completed ? 'ring-1 ring-success/40' : ''
      } ${isInactive ? 'opacity-70 ring-1 ring-destructive/40' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-base text-secondary tracking-wide truncate">{client.name}</h3>
          <span className="text-[11px] text-muted-foreground font-body">
            <span className="font-mono font-semibold text-secondary">{client.codigo || '—'}</span>
            <span className="mx-1 opacity-50">·</span>
            CC {client.cedula}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[11px] font-body text-muted-foreground whitespace-nowrap">
            {attended}/{client.totalClasses}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <Badge variant="outline" className="border-primary/30 text-primary font-body text-[10px]">
          {client.program}
        </Badge>
        {isInactive && (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <Lock className="h-3 w-3" /> Inactivo
          </Badge>
        )}
        {completed && (
          <Badge className="bg-success text-success-foreground gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
          </Badge>
        )}
        {client.medicalNotes && (
          <Badge variant="outline" className="gap-1 text-[10px] border-rose-400 text-rose-500" title={client.medicalNotes}>
            <HeartPulse className="h-3 w-3" />
          </Badge>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
};

export default ClientRow;
