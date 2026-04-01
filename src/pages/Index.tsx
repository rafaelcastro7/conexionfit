import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import ClientCard from '@/components/ClientCard';
import AddClientDialog from '@/components/AddClientDialog';
import { useClients } from '@/hooks/useClients';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Index = () => {
  const { clients, addClient, registerAttendance, deleteClient } = useClients();
  const [search, setSearch] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cedula.includes(search) ||
      c.program.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <StatsBar clients={clients} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, cédula o programa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <AddClientDialog onAdd={addClient} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onRegister={registerAttendance}
              onDelete={deleteClient}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground font-body">
            <p className="text-lg">No se encontraron clientes</p>
            <p className="text-sm">Agrega un nuevo cliente o ajusta la búsqueda</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
