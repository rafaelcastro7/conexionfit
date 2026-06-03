import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AttendanceRecord {
  id: string;
  date: string;
  classNumber: number;
  sessionTime?: string | null;
  notes?: string | null;
  signature?: string | null;
  sheetSection?: string | null;
}

export interface Client {
  id: string;
  name: string;
  cedula: string;
  codigo: string;
  status: 'active' | 'inactive';
  program: string;
  totalClasses: number;
  unitValue: number;
  totalValue: number;
  attendance: AttendanceRecord[];
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (clientsError) {
      toast.error('Error cargando clientes');
      setLoading(false);
      return;
    }

    const { data: attendanceData, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .order('class_number');

    if (attError) {
      toast.error('Error cargando asistencia');
      setLoading(false);
      return;
    }

    const mapped: Client[] = (clientsData || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      cedula: c.cedula,
      program: c.program,
      totalClasses: c.total_classes,
      unitValue: c.unit_value,
      totalValue: c.total_value,
      attendance: (attendanceData || [])
        .filter((a: any) => a.client_id === c.id)
        .map((a: any) => ({
          id: a.id,
          date: a.date,
          classNumber: a.class_number,
          sessionTime: a.session_time ?? null,
          notes: a.notes ?? null,
          signature: a.signature ?? null,
          sheetSection: a.sheet_section ?? null,
        })),
    }));

    setClients(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (client: Omit<Client, 'id' | 'attendance'>) => {
    const { error } = await supabase.from('clients').insert({
      name: client.name,
      cedula: client.cedula,
      program: client.program,
      total_classes: client.totalClasses,
      unit_value: client.unitValue,
      total_value: client.totalValue,
    });

    if (error) {
      toast.error('Error al crear cliente: ' + error.message);
      return;
    }
    toast.success('Cliente matriculado exitosamente');
    await fetchClients();
  };

  const registerAttendance = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client || client.attendance.length >= client.totalClasses) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('attendance').insert({
      client_id: clientId,
      date: dateStr,
      class_number: client.attendance.length + 1,
    });

    if (error) {
      toast.error('Error al registrar asistencia');
      return;
    }
    toast.success('Asistencia registrada');
    await fetchClients();
  };

  const registerAttendanceWithDate = async (clientId: string, dateStr: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client || client.attendance.length >= client.totalClasses) return;

    const { error } = await supabase.from('attendance').insert({
      client_id: clientId,
      date: dateStr,
      class_number: client.attendance.length + 1,
    });

    if (error) {
      toast.error('Error al registrar asistencia');
      return;
    }
    toast.success('Asistencia registrada');
    await fetchClients();
  };

  const deleteClient = async (clientId: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      toast.error('Error al eliminar cliente');
      return;
    }
    toast.success('Cliente eliminado');
    await fetchClients();
  };

  return {
    clients,
    loading,
    addClient,
    registerAttendance,
    registerAttendanceWithDate,
    deleteClient,
    refetch: fetchClients,
  };
}
