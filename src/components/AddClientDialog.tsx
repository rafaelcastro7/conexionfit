import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '@/hooks/useClients';
import { UserPlus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PACKAGE_OPTIONS = [1, 4, 10, 20] as const;
type PackageSize = (typeof PACKAGE_OPTIONS)[number];

// Reglas de precio por paquete (valor unitario por clase)
const UNIT_VALUE_BY_PACKAGE: Record<PackageSize, number> = {
  1: 70000,
  4: 60000,   // 4 x 60.000 = 240.000
  10: 40000,  // 10 x 40.000 = 400.000
  20: 33000,  // 20 x 33.000 = 660.000
};

interface PackageEntry {
  packageSize: string; // '1' | '4' | '10' | '20'
  unitValue: string;
}

export interface NewClientPayload {
  name: string;
  cedula: string | null;
  program: string | null;
  totalClasses: number;
  unitValue: number;
  totalValue: number;
  medicalNotes?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  age?: number | null;
  instagram?: string | null;
}

interface Props {
  onAdd: (client: NewClientPayload) => void | Promise<void>;
  existingClients: Client[];
}

const calcAge = (iso: string): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

const AddClientDialog = ({ onAdd, existingClients }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [instagram, setInstagram] = useState('');
  const [hasPathology, setHasPathology] = useState<'si' | 'no' | ''>('');
  const [packages, setPackages] = useState<PackageEntry[]>([
    { packageSize: '', unitValue: '' },
  ]);
  const [cedulaFound, setCedulaFound] = useState(false);
  const [existingCodigo, setExistingCodigo] = useState<string | null>(null);

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
    const trimmed = val.trim();
    const existing = trimmed ? existingClients.find((c) => c.cedula === trimmed) : null;
    if (existing) {
      setName(existing.name);
      setPhone(existing.phone ?? '');
      setBirthDate(existing.birthDate ?? '');
      setAge(existing.age ? String(existing.age) : '');
      setMedicalNotes(existing.medicalNotes ?? '');
      setHasPathology(existing.medicalNotes ? 'si' : 'no');
      setCedulaFound(true);
      setExistingCodigo(existing.codigo || null);
    } else {
      setCedulaFound(false);
      setExistingCodigo(null);
    }
  };

  const handleBirth = (val: string) => {
    setBirthDate(val);
    const a = calcAge(val);
    if (a !== null && a >= 0 && a < 120) setAge(String(a));
  };

  const addPackageRow = () => setPackages((prev) => [...prev, { packageSize: '', unitValue: '' }]);
  const removePackageRow = (index: number) => setPackages((prev) => prev.filter((_, i) => i !== index));
  const updatePackage = (index: number, field: keyof PackageEntry, value: string) =>
    setPackages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const reset = () => {
    setName(''); setCedula(''); setPhone(''); setBirthDate(''); setAge(''); setMedicalNotes(''); setHasPathology('');
    setPackages([{ packageSize: '', unitValue: '' }]);
    setCedulaFound(false); setExistingCodigo(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (hasPathology === 'si' && !medicalNotes.trim()) { toast.error('Describe la patología en observaciones'); return; }
    const finalMedicalNotes = hasPathology === 'si' ? medicalNotes.trim() : '';

    const validPackages = packages.filter((p) => p.packageSize && p.unitValue);

    const base = {
      name: name.toUpperCase(),
      cedula: cedula.trim() || null,
      medicalNotes: finalMedicalNotes || null,
      phone: phone.trim() || null,
      birthDate: birthDate || null,
      age: age ? Number(age) : null,
    };

    if (validPackages.length === 0) {
      await onAdd({ ...base, program: null, totalClasses: 0, unitValue: 0, totalValue: 0 });
    } else {
      for (const p of validPackages) {
        const size = Number(p.packageSize);
        await onAdd({
          ...base,
          program: null,
          totalClasses: size,
          unitValue: Number(p.unitValue),
          totalValue: size * Number(p.unitValue),
        });
      }
    }

    reset();
    setOpen(false);
  };

  const grandTotal = packages.reduce(
    (sum, p) => sum + Number(p.packageSize) * Number(p.unitValue),
    0
  );


  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">REGISTRAR CLIENTE</DialogTitle>
          <DialogDescription>
            Ingresa los datos básicos, estado médico y programas del cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Código</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted/60 text-sm font-mono font-semibold text-secondary">
                {displayedCodigo}
              </div>
              <p className="text-[10px] text-muted-foreground font-body">
                {existingCodigo ? 'Código existente' : 'Auto-asignado'}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Cédula <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
              <Input
                value={cedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                placeholder="Nº documento"
              />
              {cedulaFound && (
                <p className="text-[11px] text-primary font-body">Cliente existente</p>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Celular</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número" />
            </div>
            <div className="grid gap-1.5">
              <Label>Fecha nacimiento</Label>
              <Input type="date" value={birthDate} onChange={(e) => handleBirth(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Edad</Label>
              <Input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Años" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>¿Tiene lesión o patología?</Label>
              <Select value={hasPathology} onValueChange={(v) => { setHasPathology(v as 'si' | 'no'); if (v === 'no') setMedicalNotes(''); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label>
                {hasPathology === 'si' ? '¿Cuál es la patología?' : 'Observaciones'}
                {hasPathology === 'si' && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder={hasPathology === 'si' ? 'Describa cuál es la patología (ej: lesión de rodilla, hipertensión...)' : 'Sin patología'}
                disabled={hasPathology !== 'si'}
              />
            </div>
          </div>


          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Paquetes a matricular <span className="text-muted-foreground text-[10px] font-normal">(opcional — el programa se asigna en otro módulo)</span>
            </Label>
            {packages.map((entry, index) => {
              const size = Number(entry.packageSize);
              const total = size * Number(entry.unitValue);
              return (
                <div key={index} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body text-muted-foreground">Paquete {index + 1}</span>
                    {packages.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => removePackageRow(index)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Tipo de paquete</Label>
                      <Select value={entry.packageSize} onValueChange={(v) => updatePackage(index, 'packageSize', v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKAGE_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'clase' : 'clases'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[10px]">Valor Unitario</Label>
                      <Input type="number" className="h-8 text-sm" value={entry.unitValue} onChange={(e) => updatePackage(index, 'unitValue', e.target.value)} />
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

            <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addPackageRow}>
              <Plus className="h-3.5 w-3.5" /> Agregar otro paquete
            </Button>
          </div>


          {grandTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-secondary/10 p-3">
              <span className="text-sm font-body font-semibold">Total General</span>
              <span className="text-lg font-bold font-body">${grandTotal.toLocaleString('es-CO')}</span>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full mt-2">
            Guardar cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
