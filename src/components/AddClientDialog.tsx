import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROGRAMS } from '@/types/client';
import { UserPlus } from 'lucide-react';

interface Props {
  onAdd: (client: { name: string; cedula: string; program: string; totalClasses: number; unitValue: number; totalValue: number }) => void;
}

const AddClientDialog = ({ onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [program, setProgram] = useState('');
  const [totalClasses, setTotalClasses] = useState('');
  const [unitValue, setUnitValue] = useState('');

  const total = Number(totalClasses) * Number(unitValue);

  const handleSubmit = () => {
    if (!name || !cedula || !program || !totalClasses || !unitValue) return;
    onAdd({
      name: name.toUpperCase(),
      cedula,
      program,
      totalClasses: Number(totalClasses),
      unitValue: Number(unitValue),
      totalValue: total,
    });
    setName(''); setCedula(''); setProgram(''); setTotalClasses(''); setUnitValue('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">MATRICULAR CLIENTE</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nombre completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Cédula</Label>
              <Input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Nº documento" />
            </div>
            <div className="grid gap-1.5">
              <Label>Programa</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Nº Clases</Label>
              <Input type="number" value={totalClasses} onChange={(e) => setTotalClasses(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Valor Unitario</Label>
              <Input type="number" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Valor Total</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm font-medium">
                ${total.toLocaleString('es-CO')}
              </div>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full mt-2">Matricular</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
