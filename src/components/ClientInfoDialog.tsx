import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/hooks/useClients';

interface Props {
  existingClients: Client[];
  onSaved?: () => void;
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

const ClientInfoDialog = ({ existingClients, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<string>('');
  const [matched, setMatched] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCedulaChange = (val: string) => {
    setCedula(val);
    const found = existingClients.find((c) => c.cedula === val.trim());
    if (found) {
      setFullName(found.name);
      setMatched(found);
    } else {
      setMatched(null);
    }
  };

  const handleBirth = (val: string) => {
    setBirthDate(val);
    const a = calcAge(val);
    if (a !== null && a >= 0 && a < 120) setAge(String(a));
  };

  const reset = () => {
    setCedula(''); setFullName(''); setPhone(''); setBirthDate(''); setAge(''); setMatched(null);
  };

  const handleSubmit = async () => {
    if (!cedula.trim() || !fullName.trim()) {
      toast.error('Cédula y nombre son obligatorios');
      return;
    }
    setSaving(true);
    const payload = {
      name: fullName.toUpperCase(),
      phone: phone || null,
      birth_date: birthDate || null,
      age: age ? Number(age) : null,
    };

    let error;
    if (matched) {
      ({ error } = await supabase.from('clients').update(payload).eq('cedula', cedula.trim()));
    } else {
      toast.error('Cliente no encontrado. Matricúlalo primero en "Nuevo Cliente".');
      setSaving(false);
      return;
    }

    setSaving(false);
    if (error) {
      toast.error('Error al guardar: ' + error.message);
      return;
    }
    toast.success('Información actualizada');
    reset();
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Información Inicial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">INFORMACIÓN INICIAL DEL CLIENTE</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Cédula</Label>
            <Input
              value={cedula}
              onChange={(e) => handleCedulaChange(e.target.value)}
              placeholder="Buscar cliente por cédula"
            />
            {matched && (
              <p className="text-[11px] text-primary font-body">
                Cliente encontrado — Código {matched.codigo}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Nombre completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre y apellidos" />
          </div>

          <div className="grid gap-1.5">
            <Label>Celular</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de celular" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={birthDate} onChange={(e) => handleBirth(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Edad</Label>
              <Input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Años" />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full mt-2">
            {saving ? 'Guardando...' : 'Guardar información'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientInfoDialog;
