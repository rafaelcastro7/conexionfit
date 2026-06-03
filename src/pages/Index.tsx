import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import ClientCard from '@/components/ClientCard';
import ClientsTable from '@/components/ClientsTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddClientDialog from '@/components/AddClientDialog';
import ImportClientsDialog from '@/components/ImportClientsDialog';
import PlantillaAsistenciaDialog from '@/components/PlantillaAsistenciaDialog';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { realImages } from '@/lib/realImages';

const CLIENTS_REFRESH = 'conexionfit:clients-refresh';

const Index = () => {
  const navigate = useNavigate();
  const { clients, loading, addClient, registerAttendance, deleteClient, setClientStatus, setClientCategory, refetch } = useClients();
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const fn = () => {
      void refetch();
    };
    window.addEventListener(CLIENTS_REFRESH, fn);
    return () => window.removeEventListener(CLIENTS_REFRESH, fn);
  }, [refetch]);

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
                  <PlantillaAsistenciaDialog
                    onStagingCreated={(id) => {
                      toast.success('Lote creado en staging. Revisa validación e importa a producción.');
                      navigate(`/imports/${id}`);
                    }}
                  />
                  <ImportClientsDialog
                    onStagingCreated={(id) => {
                      toast.success('Lote Excel en staging. Valida duplicados y aplica cuando esté listo.');
                      navigate(`/imports/${id}`);
                    }}
                  />
                  <AddClientDialog onAdd={addClient} existingClients={clients} />
                </div>
              )}
            </div>

            <ClientsTable
              clients={filtered}
              onRowClick={(id) => setDetailId(id)}
              canEditCategory={role === 'admin'}
              onCategoryChange={setClientCategory}
            />


            <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display tracking-wide">Ficha del cliente</DialogTitle>
                </DialogHeader>
                {(() => {
                  const client = clients.find((c) => c.id === detailId);
                  if (!client) return null;
                  const others = cedulaPrograms[client.cedula]?.filter((p) => p !== client.program) || [];
                  return (
                    <ClientCard
                      client={client}
                      onRegister={registerAttendance}
                      onDelete={(id) => { deleteClient(id); setDetailId(null); }}
                      onToggleStatus={setClientStatus}
                      otherPrograms={others}
                      canRegister={role === 'admin' || role === 'instructor'}
                      canDelete={role === 'admin'}
                      canToggleStatus={role === 'admin'}
                    />
                  );
                })()}
              </DialogContent>
            </Dialog>


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
