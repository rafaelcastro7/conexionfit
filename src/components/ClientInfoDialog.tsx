import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/hooks/useClients';

interface Props {
  existingClients: Client[];
  onSaved?: () => void;
}

type Mode = 'registered' | 'new';

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
  const [mode, setMode] = useState<Mode>('registered');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<string>('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const uniqueClients = useMemo(() => {
    const map = new Map<string, Client>();
    for (const c of existingClients) {
      if (!map.has(c.cedula)) map.set(c.cedula, c);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [existingClients]);

  const selectClient = (c: Client) => {
    setSelected(c);
    setFullName(c.name);
    setPhone((c as any).phone ?? '');
    const bd = (c as any).birth_date ?? '';
    setBirthDate(bd || '');
    const a = (c as any).age;
    setAge(a ? String(a) : (bd ? String(calcAge(bd) ?? '') : ''));
    setMedicalNotes((c as any).medical_notes ?? '');
    setPickerOpen(false);
  };

  const handleBirth = (val: string) => {
    setBirthDate(val);
    const a = calcAge(val);
    if (a !== null && a >= 0 && a < 120) setAge(String(a));
  };

  const reset = () => {
    setSelected(null); setFullName(''); setPhone(''); setBirthDate(''); setAge(''); setMedicalNotes('');
    setMode('registered');
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    setSelected(null); setFullName(''); setPhone(''); setBirthDate(''); setAge(''); setMedicalNotes('');
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);

    if (mode === 'registered') {
      if (!selected) {
        setSaving(false);
        toast.error('Selecciona un cliente');
        return;
      }
      const { error } = await supabase.from('clients').update({
        name: fullName.toUpperCase(),
        phone: phone || null,
        birth_date: birthDate || null,
        age: age ? Number(age) : null,
        medical_notes: medicalNotes.trim() || null,
      }).eq('cedula', selected.cedula);
      setSaving(false);
      if (error) { toast.error('Error al guardar: ' + error.message); return; }
      toast.success('Información actualizada');
    } else {
      const { error } = await supabase.from('client_prospects').insert({
        full_name: fullName.toUpperCase(),
        phone: phone || null,
        birth_date: birthDate || null,
        age: age ? Number(age) : null,
        medical_notes: medicalNotes.trim() || null,
      });
      setSaving(false);
      if (error) { toast.error('Error al guardar: ' + error.message); return; }
      toast.success('Pre-registro guardado');
    }

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
          <Tabs value={mode} onValueChange={(v) => changeMode(v as Mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registered">Cliente registrado</TabsTrigger>
              <TabsTrigger value="new">Cliente nuevo</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === 'registered' && (
            <div className="grid gap-1.5">
              <Label>Cliente</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn('justify-between font-normal', !selected && 'text-muted-foreground')}
                  >
                    {selected ? `${selected.codigo} — ${selected.name}` : 'Selecciona un cliente matriculado'}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre o código..." />
                    <CommandList>
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {uniqueClients.map((c) => (
                          <CommandItem
                            key={c.cedula}
                            value={`${c.codigo} ${c.name}`}
                            onSelect={() => selectClient(c)}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selected?.cedula === c.cedula ? 'opacity-100' : 'opacity-0')} />
                            <span className="font-mono text-xs mr-2">{c.codigo}</span>
                            <span>{c.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {mode === 'new' && (
            <p className="text-xs text-muted-foreground -mb-1">
              Se guardará como pre-registro. Cuando se matricule, completa cédula y programa en "Nuevo Cliente".
            </p>
          )}

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

          <div className="grid gap-1.5">
            <Label>¿Tiene alguna lesión o patología?</Label>
            <Input value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Describa lesión o patología (opcional)" />
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
