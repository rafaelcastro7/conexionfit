import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseSessionRowsFromPaste,
  parseSesionesLabel,
  normalizeCedula,
  type ParsedSessionRow,
} from '@/lib/parseSessionSheet';
import { createBatchFromSessionSheet } from '@/modules/import-staging/stagingService';

interface Props {
  onStagingCreated: (batchId: string) => void;
}

const EXAMPLE_PASTE = `1\t18 FEB 2026\t7:00 pm\t\tSebas
2\t05 MARZO 2026\t7:00 pm\t\tSebas
---ADICION---
1\t01 JUN 2026\t6:00 pm\tJR\tGIO`;

const PlantillaAsistenciaDialog = ({ onStagingCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [sesiones, setSesiones] = useState('');
  const [program, setProgram] = useState('PLAN CLASES');
  const [unitValue, setUnitValue] = useState<number>(0);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sheetNotes, setSheetNotes] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [rows, setRows] = useState<ParsedSessionRow[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);

  const interpretPaste = (text: string) => {
    const parsed = parseSessionRowsFromPaste(text);
    setRows(parsed);
    if (parsed.length === 0) {
      toast.message('No se detectaron filas', {
        description: 'Usa tabuladores: No. | Fecha | Hora | [Firma] | Obs. Línea ---ADICION--- para clases de adición.',
      });
    }
  };

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingPdf(true);
    try {
      const { extractTextFromPdf } = await import('@/lib/extractPdfText');
      const buf = await file.arrayBuffer();
      const text = await extractTextFromPdf(buf);
      setPasteText(text);
      interpretPaste(text);
      if (text.length < 40) {
        toast.message('Poco texto en el PDF', {
          description:
            'Las planillas escaneadas a mano no suelen tener texto seleccionable. Usa pegar tabla u OCR externo.',
        });
      }
    } catch {
      toast.error('No se pudo leer el PDF');
    } finally {
      setLoadingPdf(false);
      if (pdfRef.current) pdfRef.current.value = '';
    }
  };

  const validRows = rows.filter((r) => r.dateIso && !r.error);
  const invalidRows = rows.filter((r) => !r.dateIso || r.error);

  const handleSave = async () => {
    const cNorm = normalizeCedula(cedula);
    if (!name.trim() || !cNorm) {
      toast.error('Nombre y cédula son obligatorios');
      return;
    }
    if (validRows.length === 0) {
      toast.error('Agrega al menos una fila válida con fecha reconocida');
      return;
    }
    const fromLabel = parseSesionesLabel(sesiones);
    const fromRows = Math.max(...validRows.map((r) => r.classNumber));
    const totalSessions = Math.max(fromLabel || 0, fromRows, 10);

    setSaving(true);
    try {
      const batchId = await createBatchFromSessionSheet({
        name: name.trim(),
        cedula: cNorm,
        program: program.trim() || 'PLAN CLASES',
        unitValue: Number.isFinite(unitValue) ? unitValue : 0,
        totalSessions,
        phone: phone.trim(),
        email: email.trim(),
        invoiceNumber: invoiceNumber.trim(),
        sheetNotes: sheetNotes.trim(),
        rows: validRows.map((r) => ({
          classNumber: r.classNumber,
          dateIso: r.dateIso!,
          sessionTime: r.sessionTime,
          signature: r.signature || '',
          notes: r.notes,
          sheetSection: r.sheetSection,
        })),
      });
      setOpen(false);
      setRows([]);
      setPasteText('');
      setName('');
      setCedula('');
      setSesiones('');
      setPhone('');
      setEmail('');
      setInvoiceNumber('');
      setSheetNotes('');
      onStagingCreated(batchId);
    } catch (e: any) {
      toast.error(e?.message || 'Error al crear lote');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setRows([]); setPasteText(''); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" /> Planilla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-secondary tracking-wide">
            CARGAR PLANILLA (STAGING)
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-body pt-1">
            Los datos se envían a la cola de importación: validación de duplicados y aplicación a producción solo desde ahí.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. PEDRO Y MARIANA" className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Cédula (CC)</Label>
              <Input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Solo números" className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Sesiones</Label>
              <Input value={sesiones} onChange={(e) => setSesiones(e.target.value)} placeholder="Ej. 20 + 2 o 22" className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Programa</Label>
              <Input value={program} onChange={(e) => setProgram(e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Celular (opc.)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Correo (opc.)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">No. factura (opc.)</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Cumple / notas cabecera (opc.)</Label>
              <Input value={sheetNotes} onChange={(e) => setSheetNotes(e.target.value)} className="font-body" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-body">Valor unitario (clase)</Label>
              <Input
                type="number"
                min={0}
                value={unitValue}
                onChange={(e) => setUnitValue(parseInt(e.target.value, 10) || 0)}
                className="font-body max-w-xs"
              />
            </div>
          </div>

          <Tabs defaultValue="paste" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" className="text-xs font-body">
                Pegar tabla
              </TabsTrigger>
              <TabsTrigger value="pdf" className="text-xs font-body">
                Subir PDF
              </TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="space-y-2 mt-3">
              <p className="text-[11px] text-muted-foreground font-body">
                Columnas por tab: <strong>No.</strong> | <strong>Fecha</strong> | <strong>Hora</strong> | <strong>Firma</strong> (opc.) |{' '}
                <strong>Obs.</strong> Línea solo con <code className="text-[10px]">---ADICION---</code> activa clases de adición.
              </p>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={EXAMPLE_PASTE}
                rows={8}
                className="font-mono text-xs"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => interpretPaste(pasteText)} className="gap-2">
                Interpretar filas
              </Button>
            </TabsContent>
            <TabsContent value="pdf" className="space-y-2 mt-3">
              <p className="text-[11px] text-muted-foreground font-body">Solo PDF con texto seleccionable.</p>
              <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdf} />
              <Button type="button" variant="outline" size="sm" disabled={loadingPdf} onClick={() => pdfRef.current?.click()} className="gap-2">
                {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Elegir PDF
              </Button>
            </TabsContent>
          </Tabs>

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success/10 text-success border-success/30 font-body text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {validRows.length} listas
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive" className="font-body text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" /> {invalidRows.length} con fecha dudosa
                  </Badge>
                )}
              </div>
              <div className="max-h-52 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-12">#</TableHead>
                      <TableHead className="text-xs">Sec.</TableHead>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Hora</TableHead>
                      <TableHead className="text-xs">Firma</TableHead>
                      <TableHead className="text-xs">Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 50).map((r) => (
                      <TableRow key={`${r.sheetSection}-${r.classNumber}-${r.dateRaw}`} className={r.dateIso ? '' : 'bg-destructive/5'}>
                        <TableCell className="text-xs font-mono">{r.classNumber}</TableCell>
                        <TableCell className="text-[10px] uppercase">{r.sheetSection === 'adicional' ? 'Ad.' : 'Pr.'}</TableCell>
                        <TableCell className="text-xs font-body">{r.dateIso || r.dateRaw}</TableCell>
                        <TableCell className="text-xs font-body">{r.sessionTime}</TableCell>
                        <TableCell className="text-xs font-body">{r.signature || '—'}</TableCell>
                        <TableCell className="text-xs font-body">{r.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || validRows.length === 0} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Enviar a cola de validación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlantillaAsistenciaDialog;
