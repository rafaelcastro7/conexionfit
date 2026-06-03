import { Client } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';
import { Lock, HeartPulse, Smile } from 'lucide-react';

interface Props {
  clients: Client[];
  onRowClick: (id: string) => void;
}

const formatBirth = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const ClientsTable = ({ clients, onRowClick }: Props) => {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr className="text-left font-display tracking-wider text-xs uppercase">
              <th className="px-3 py-2.5">Nombre</th>
              <th className="px-3 py-2.5">Código</th>
              <th className="px-3 py-2.5">Cumpleaños</th>
              <th className="px-3 py-2.5 text-center">Edad</th>
              <th className="px-3 py-2.5 text-center">Categoría</th>
              <th className="px-3 py-2.5 text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const completed = c.attendance.length >= c.totalClasses;
              const inactive = c.status === 'inactive';
              return (
                <tr
                  key={c.id}
                  onClick={() => onRowClick(c.id)}
                  className={`border-t cursor-pointer transition-colors hover:bg-muted/60 ${
                    inactive ? 'opacity-70' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 font-body font-medium text-secondary">
                    <div className="truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{c.program}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.codigo || '—'}</td>
                  <td className="px-3 py-2.5 font-body">{formatBirth(c.birthDate)}</td>
                  <td className="px-3 py-2.5 text-center font-body">{c.age ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    {c.medicalNotes ? (
                      <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 gap-1 text-[10px] dark:bg-rose-950 dark:text-rose-300">
                        <HeartPulse className="h-3 w-3" /> Patología
                      </Badge>
                    ) : (
                      <Smile className="h-4 w-4 text-emerald-600 inline-block" aria-label="Sin patología" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {!inactive && (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 gap-1 text-[10px] dark:bg-emerald-950 dark:text-emerald-300">
                          Activo
                        </Badge>
                      )}
                      {inactive && (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <Lock className="h-3 w-3" /> Inactivo
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsTable;
