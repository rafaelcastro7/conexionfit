import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportRow {
  name: string;
  cedula: string;
  program: string;
  totalClasses: number;
  unitValue: number;
  totalValue: number;
  valid: boolean;
  error?: string;
}

interface Props {
  onImport: (client: { name: string; cedula: string; program: string; totalClasses: number; unitValue: number; totalValue: number }) => Promise<void>;
}

const ImportClientsDialog = ({ onImport }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const parsed: ImportRow[] = data.map((row: any) => {
        const name = String(row['NOMBRE'] || row['nombre'] || row['Name'] || row['name'] || '').toUpperCase().trim();
        const cedula = String(row['CEDULA'] || row['cedula'] || row['Cedula'] || row['CC'] || row['cc'] || '').trim();
        const program = String(row['PROGRAMA'] || row['programa'] || row['Program'] || row['program'] || '').toUpperCase().trim();
        const totalClasses = Number(row['CLASES'] || row['clases'] || row['TOTAL_CLASES'] || row['total_clases'] || row['Classes'] || 0);
        const unitValue = Number(row['VALOR_UNITARIO'] || row['valor_unitario'] || row['UNITARIO'] || row['unitario'] || row['Unit'] || 0);
        const totalValue = totalClasses * unitValue;

        const errors: string[] = [];
        if (!name) errors.push('Sin nombre');
        if (!cedula) errors.push('Sin cédula');
        if (!program) errors.push('Sin programa');
        if (!totalClasses) errors.push('Sin clases');
        if (!unitValue) errors.push('Sin valor');

        return {
          name, cedula, program, totalClasses, unitValue, totalValue,
          valid: errors.length === 0,
          error: errors.join(', '),
        };
      });

      setRows(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImported(0);
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      await onImport({ name: r.name, cedula: r.cedula, program: r.program, totalClasses: r.totalClasses, unitValue: r.unitValue, totalValue: r.totalValue });
      setImported(i + 1);
    }
    setImporting(false);
    toast.success(`${validRows.length} clientes importados exitosamente`);
    setRows([]);
    setOpen(false);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setRows([]); setImported(0); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Upload className="h-4 w-4" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-secondary tracking-wide">IMPORTAR CLIENTES</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-body mb-1">Sube un archivo Excel o CSV</p>
            <p className="text-xs text-muted-foreground/60 font-body mb-4">
              Columnas: NOMBRE, CEDULA, PROGRAMA, CLASES, VALOR_UNITARIO
            </p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Seleccionar Archivo
            </Button>
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <Badge className="bg-success/10 text-success border-success/30 font-body">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {validCount} válidos
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="font-body">
                    <AlertCircle className="h-3 w-3 mr-1" /> {invalidCount} con errores
                  </Badge>
                )}
              </div>

              <div className="overflow-x-auto max-h-60 rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Estado</TableHead>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Cédula</TableHead>
                      <TableHead className="text-xs">Programa</TableHead>
                      <TableHead className="text-xs">Clases</TableHead>
                      <TableHead className="text-xs">V. Unit.</TableHead>
                      <TableHead className="text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 50).map((r, i) => (
                      <TableRow key={i} className={!r.valid ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          {r.valid ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                        </TableCell>
                        <TableCell className="text-xs font-body">{r.name || '—'}</TableCell>
                        <TableCell className="text-xs font-body">{r.cedula || '—'}</TableCell>
                        <TableCell className="text-xs font-body">{r.program || '—'}</TableCell>
                        <TableCell className="text-xs font-body">{r.totalClasses || '—'}</TableCell>
                        <TableCell className="text-xs font-body">${r.unitValue.toLocaleString('es-CO')}</TableCell>
                        <TableCell className="text-xs font-body font-semibold">${r.totalValue.toLocaleString('es-CO')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={handleImport} disabled={importing || validCount === 0} className="w-full gap-2">
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importando {imported}/{validCount}...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Importar {validCount} Clientes</>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportClientsDialog;
