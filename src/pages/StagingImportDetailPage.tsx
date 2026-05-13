import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  fetchImportBatch,
  fetchStagingClients,
  fetchStagingAttendance,
  runValidateStagingBatch,
  runApplyStagingBatch,
  updateStagingClientInclude,
  updateStagingAttendanceInclude,
  type ImportBatchRow,
  type StagingClientRow,
  type StagingAttendanceRow,
} from '@/modules/import-staging/stagingService';
import { ArrowLeft, Loader2, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const REFRESH = 'conexionfit:clients-refresh';

function statusColor(status: string) {
  switch (status) {
    case 'valid':
      return 'text-emerald-600';
    case 'duplicate_production':
      return 'text-amber-600';
    case 'duplicate_batch':
      return 'text-orange-600';
    case 'invalid':
      return 'text-destructive';
    case 'warning':
      return 'text-amber-600';
    default:
      return 'text-muted-foreground';
  }
}

const StagingImportDetailPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<ImportBatchRow | null>(null);
  const [clients, setClients] = useState<StagingClientRow[]>([]);
  const [attendance, setAttendance] = useState<StagingAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastValidate, setLastValidate] = useState<Record<string, unknown> | null>(null);

  const loadAll = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const b = await fetchImportBatch(batchId);
      if (!b) {
        setBatch(null);
        return;
      }
      setBatch(b);
      const [c, a] = await Promise.all([fetchStagingClients(batchId), fetchStagingAttendance(batchId)]);
      setClients(c);
      setAttendance(a);
    } catch (e: any) {
      toast.error(e?.message || 'Error cargando lote');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onValidate = async () => {
    if (!batchId) return;
    setBusy(true);
    try {
      const res = await runValidateStagingBatch(batchId);
      setLastValidate(res);
      toast.success('Validación completada');
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || 'Error en validación');
    } finally {
      setBusy(false);
    }
  };

  const onApply = async () => {
    if (!batchId) return;
    setBusy(true);
    try {
      const res = await runApplyStagingBatch(batchId);
      toast.success(
        `Producción actualizada: ${(res as any).clients_upserted ?? 0} clientes, ${(res as any).attendance_inserted ?? 0} asistencias`
      );
      window.dispatchEvent(new CustomEvent(REFRESH));
      navigate('/');
    } catch (e: any) {
      toast.error(e?.message || 'Error al aplicar');
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  if (!batchId) return null;

  if (loading && !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 text-center">
          <p className="text-muted-foreground font-body mb-4">Lote no encontrado.</p>
          <Button asChild variant="outline">
            <Link to="/imports">Volver a la cola</Link>
          </Button>
        </main>
      </div>
    );
  }

  const canValidate = batch.status !== 'applied' && batch.status !== 'applying';
  const canApply = batch.status === 'validated';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/imports">
              <ArrowLeft className="h-4 w-4" /> Cola
            </Link>
          </Button>
          <h1 className="font-display text-xl text-secondary tracking-wide flex-1 min-w-0 truncate">
            {batch.label || batch.source}
          </h1>
          <Badge variant={batch.status === 'applied' ? 'default' : 'secondary'} className="uppercase text-[10px]">
            {batch.status}
          </Badge>
        </div>

        {batch.error_message && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-3 text-sm text-destructive font-body">{batch.error_message}</CardContent>
          </Card>
        )}

        {lastValidate && (
          <Card className="bg-muted/40">
            <CardContent className="py-3 text-xs font-mono text-muted-foreground">{JSON.stringify(lastValidate)}</CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onValidate} disabled={busy || !canValidate || batch.status === 'applied'} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Ejecutar validación
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={busy || !canApply} className="gap-2 bg-success hover:bg-success/90">
                <CheckCircle className="h-4 w-4" /> Aplicar a producción
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar promoción</AlertDialogTitle>
                <AlertDialogDescription className="font-body text-sm">
                  Se insertarán o fusionarán en las tablas reales solo las filas marcadas para aplicar y con estado válido
                  o duplicado de producción (asistencias con advertencia se reemplazan). Esta acción no se puede deshacer
                  desde aquí.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => void onApply()}>Aplicar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display text-secondary tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Clientes (staging)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs">Nombre</TableHead>
                  <TableHead className="text-xs">CC</TableHead>
                  <TableHead className="text-xs">Programa</TableHead>
                  <TableHead className="text-xs">Clases</TableHead>
                  <TableHead className="text-xs text-right">Errores / notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={r.include_in_apply}
                        disabled={batch.status === 'applied'}
                        onCheckedChange={(v) => {
                          void updateStagingClientInclude(r.id, Boolean(v)).then(() => loadAll());
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono">{r.line_number}</TableCell>
                    <TableCell className={`text-xs font-semibold ${statusColor(r.validation_status)}`}>{r.validation_status}</TableCell>
                    <TableCell className="text-xs font-body max-w-[140px] truncate">{r.name}</TableCell>
                    <TableCell className="text-xs font-mono">{r.cedula}</TableCell>
                    <TableCell className="text-xs">{r.program}</TableCell>
                    <TableCell className="text-xs">{r.total_classes}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground max-w-xs">
                      {(r.validation_errors || []).join(' · ')}
                      {r.duplicate_of_client_id ? ` · prod: ${r.duplicate_of_client_id.slice(0, 8)}…` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {attendance.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display text-secondary tracking-wide">Asistencias (staging)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="text-xs">Cliente #</TableHead>
                    <TableHead className="text-xs">Clase</TableHead>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Hora</TableHead>
                    <TableHead className="text-xs">Sección</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Firma / obs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Checkbox
                          checked={r.include_in_apply}
                          disabled={batch.status === 'applied'}
                          onCheckedChange={(v) => {
                            void updateStagingAttendanceInclude(r.id, Boolean(v)).then(() => loadAll());
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.client_line_number}</TableCell>
                      <TableCell className="text-xs font-mono">{r.class_number}</TableCell>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell className="text-xs">{r.session_time || '—'}</TableCell>
                      <TableCell className="text-xs">{r.sheet_section}</TableCell>
                      <TableCell className={`text-xs font-semibold ${statusColor(r.validation_status)}`}>{r.validation_status}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate">
                        {[r.signature, r.notes].filter(Boolean).join(' · ')} {(r.validation_errors || []).join('; ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StagingImportDetailPage;
