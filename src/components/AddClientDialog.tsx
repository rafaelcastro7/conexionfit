import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROGRAMS } from '@/types/client';
import { Client } from '@/hooks/useClients';
import { UserPlus, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProgramEntry {
  program: string;
  totalClasses: string;
  unitValue: string;
}

interface Props {
  onAdd: (client: { name: string; cedula: string; program: string; totalClasses: number; unitValue: number; totalValue: number }) => void;
  existingClients: Client[];
}

const AddClientDialog = ({ onAdd, existingClients }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [programs, setPrograms] = useState<ProgramEntry[]>([
    { program: '', totalClasses: '', unitValue: '' },
  ]);
  const [cedulaFound, setCedulaFound] = useState(false);
  const [existingCodigo, setExistingCodigo] = useState<string | null>(null);

  // Compute next sequential code from clients already loaded
  const nextCodigo = (() => {
    const nums = existingClients
      .map((c) => parseInt(String(c.codigo || '').replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `C-${String(max + 1).padStart(4, '0')}`;
  })();

  const displayedCodigo = existingCodigo ?? nextCodigo;

  const handleCedulaChange = (val: string) => {
    setCedula(val);
    const existing = existingClients.find((c) => c.cedula === val.trim());
    if (existing) {
      setName(existing.name);
      setCedulaFound(true);
      setExistingCodigo(existing.codigo || null);
    } else {
      setCedulaFound(false);
      setExistingCodigo(null);
    }
  };


  const existingPrograms = existingClients
    .filter((c) => c.cedula === cedula.trim())
    .map((c) => c.program);

  const availablePrograms = (index: number) => {
    const selectedInForm = programs.map((p, i) => (i !== index ? p.program : '')).filter(Boolean);
    return PROGRAMS.filter((p) => !existingPrograms.includes(p) && !selectedInForm.includes(p));
  };

  const addProgramRow = () => {
    setPrograms((prev) => [...prev, { program: '', totalClasses: '', unitValue: '' }]);
  };

  const removeProgramRow = (index: number) => {
    setPrograms((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProgram = (index: number, field: keyof ProgramEntry, value: string) => {
    setPrograms((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const canAddMore = programs.length < PROGRAMS.length - existingPrograms.length;

  const handleSubmit = async () => {
    const validPrograms = programs.filter(
      (p) => p.program && p.totalClasses && p.unitValue
    );
    if (!name || !cedula || validPrograms.length === 0) return;

    for (const p of validPrograms) {
      await onAdd({
        name: name.toUpperCase(),
        cedula: cedula.trim(),
        program: p.program,
        totalClasses: Number(p.totalClasses),
        unitValue: Number(p.unitValue),
        totalValue: Number(p.totalClasses) * Number(p.unitValue),
      });
    }

    setName('');
    setCedula('');
    setPrograms([{ program: '', totalClasses: '', unitValue: '' }]);
    setCedulaFound(false);
    setExistingCodigo(null);
    setOpen(false);
  };

  const grandTotal = programs.reduce(
    (sum, p) => sum + Number(p.totalClasses) * Number(p.unitValue),
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">MATRICULAR CLIENTE</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Código</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted/60 text-sm font-mono font-semibold text-secondary">
                {displayedCodigo}
              </div>
              <p className="text-[10px] text-muted-foreground font-body">
                {existingCodigo ? 'Código existente del cliente' : 'Se asignará automáticamente'}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Cédula</Label>
              <Input
                value={cedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                placeholder="Nº documento"
              />
              {cedulaFound && (
                <p className="text-[11px] text-primary font-body">Cliente existente — se agregará programa</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Nombre completo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                disabled={cedulaFound}
              />
            </div>
          </div>

          {existingPrograms.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Programas actuales:</span>
              {existingPrograms.map((p) => (
                <Badge key={p} variant="secondary" className="text-[10px] font-body">{p}</Badge>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Programas a matricular</Label>
            {programs.map((entry, index) => {
              const total = Number(entry.totalClasses) * Number(entry.unitValue);
              return (
                <div key={index} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body text-muted-foreground">Programa {index + 1}</span>
                    {programs.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => removeProgramRow(index)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Select value={entry.program} onValueChange={(v) => updateProgram(index, 'program', v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccionar programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrograms(index).map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Nº Clases</Label>
                      <Input type="number" className="h-8 text-sm" value={entry.totalClasses} onChange={(e) => updateProgram(index, 'totalClasses', e.target.value)} />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Valor Unitario</Label>
                      <Input type="number" className="h-8 text-sm" value={entry.unitValue} onChange={(e) => updateProgram(index, 'unitValue', e.target.value)} />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Subtotal</Label>
                      <div className="flex items-center h-8 px-2 rounded-md border bg-muted text-xs font-medium">
                        ${total.toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {canAddMore && (
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addProgramRow}>
                <Plus className="h-3.5 w-3.5" /> Agregar otro programa
              </Button>
            )}
          </div>

          {programs.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-secondary/10 p-3">
              <span className="text-sm font-body font-semibold">Total General</span>
              <span className="text-lg font-bold font-body">${grandTotal.toLocaleString('es-CO')}</span>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full mt-2">
            Matricular {programs.filter((p) => p.program).length > 1 ? `(${programs.filter((p) => p.program).length} programas)` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
