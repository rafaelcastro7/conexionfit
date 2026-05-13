import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { listImportBatches, deleteImportBatch, type ImportBatchRow } from '@/modules/import-staging/stagingService';
import { Loader2, ClipboardList, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function statusVariant(s: string) {
  switch (s) {
    case 'applied':
      return 'default' as const;
    case 'validated':
      return 'secondary' as const;
    case 'failed':
      return 'destructive' as const;
    case 'draft':
      return 'outline' as const;
    default:
      return 'outline' as const;
  }
}

const StagingImportsPage = () => {
  const [rows, setRows] = useState<ImportBatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listImportBatches());
    } catch (e: any) {
      toast.error(e?.message || 'Error cargando lotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string, status: string) => {
    if (status === 'applied' || status === 'applying') {
      toast.error('No se puede eliminar un lote ya aplicado');
      return;
    }
    if (!confirm('¿Eliminar este lote de staging?')) return;
    try {
      await deleteImportBatch(id);
      toast.success('Lote eliminado');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-2xl text-secondary tracking-wide">COLA DE IMPORTACIÓN</h1>
            <p className="text-sm text-muted-foreground font-body">
              Validación, duplicados y promoción a tablas de producción.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground font-body">
              No hay lotes. Usa <strong>Importar</strong> o <strong>Planilla</strong> en Clientes para enviar datos aquí.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((b) => (
              <Card key={b.id} className="border-border/60">
                <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-body font-medium truncate">{b.label || b.source}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{b.id}</p>
                  </div>
                  <Badge variant={statusVariant(b.status)} className="shrink-0 uppercase text-[10px]">
                    {b.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" size="sm" asChild className="gap-1">
                    <Link to={`/imports/${b.id}`}>
                      Revisar <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  {b.status !== 'applied' && b.status !== 'applying' && (
                    <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={() => handleDelete(b.id, b.status)}>
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StagingImportsPage;
