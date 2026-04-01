import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import ClientCard from '@/components/ClientCard';
import AddClientDialog from '@/components/AddClientDialog';
import ImportClientsDialog from '@/components/ImportClientsDialog';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { realImages } from '@/lib/realImages';

const Index = () => {
  const { clients, loading, addClient, registerAttendance, deleteClient } = useClients();
  const { role } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cedula.includes(search) ||
      c.program.toLowerCase().includes(search.toLowerCase())
  );

  const cedulaPrograms = clients.reduce<Record<string, string[]>>((acc, c) => {
    if (!acc[c.cedula]) acc[c.cedula] = [];
    acc[c.cedula].push(c.program);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative h-32 overflow-hidden">
        <img src={realImages[4]} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-secondary/70 to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-2xl text-primary-foreground tracking-[0.3em] opacity-80">GESTIÓN DE CLIENTES</p>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
              {role === 'admin' && (
                <div className="flex items-center gap-2">
                  <ImportClientsDialog onImport={addClient} />
                  <AddClientDialog onAdd={addClient} existingClients={clients} />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((client) => {
                const others = cedulaPrograms[client.cedula]?.filter((p) => p !== client.program) || [];
                return (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onRegister={registerAttendance}
                    onDelete={deleteClient}
                    otherPrograms={others}
                    canRegister={role === 'admin' || role === 'instructor'}
                    canDelete={role === 'admin'}
                  />
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-body">
                <p className="text-lg">No se encontraron clientes</p>
                <p className="text-sm">Agrega un nuevo cliente o ajusta la búsqueda</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
