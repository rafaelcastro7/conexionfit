import { Client, ClientCategory } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, HeartPulse, CheckCircle2 } from 'lucide-react';

interface Props {
  clients: Client[];
  onRowClick: (id: string) => void;
  canEditCategory?: boolean;
  onCategoryChange?: (cedula: string, category: ClientCategory | null) => void;
}

const CATEGORIES: ClientCategory[] = ['DIAMANTE', 'ORO', 'PLATA', 'BRONCE'];

const categoryClasses: Record<ClientCategory, string> = {
  DIAMANTE: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300',
  ORO: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  PLATA: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
  BRONCE: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
};

const formatBirth = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const ClientsTable = ({ clients, onRowClick, canEditCategory = false, onCategoryChange }: Props) => {
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
              <th className="px-3 py-2.5">Cliente</th>
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
                    <div className="flex items-center gap-2">
                      <span className="truncate">{c.name}</span>
                      {c.medicalNotes && (
                        <HeartPulse className="h-3.5 w-3.5 text-rose-500 shrink-0" aria-label={c.medicalNotes} />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal">{c.program}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.codigo || '—'}</td>
                  <td className="px-3 py-2.5 font-body">{formatBirth(c.birthDate)}</td>
                  <td className="px-3 py-2.5 text-center font-body">{c.age ?? '—'}</td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    {canEditCategory && onCategoryChange ? (
                      <Select
                        value={c.category ?? 'none'}
                        onValueChange={(v) =>
                          onCategoryChange(c.cedula, v === 'none' ? null : (v as ClientCategory))
                        }
                      >
                        <SelectTrigger
                          className={`h-7 w-32 text-xs font-semibold ${
                            c.category ? categoryClasses[c.category] : ''
                          }`}
                        >
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : c.category ? (
                      <Badge variant="outline" className={`font-semibold ${categoryClasses[c.category]}`}>
                        {c.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {inactive && (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <Lock className="h-3 w-3" /> Inactivo
                        </Badge>
                      )}
                      {completed && (
                        <Badge className="bg-success text-success-foreground gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> {c.attendance.length}/{c.totalClasses}
                        </Badge>
                      )}
                      {!completed && !inactive && (
                        <span className="text-[11px] text-muted-foreground font-body">
                          {c.attendance.length}/{c.totalClasses}
                        </span>
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
