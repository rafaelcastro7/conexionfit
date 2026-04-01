import { useState, useEffect } from 'react';
import { Client } from '@/types/client';

const STORAGE_KEY = 'conexion-fit-clients';

const initialClients: Client[] = [
  {
    id: '1',
    name: 'GIOVANNY SANCHEZ',
    cedula: '1234',
    program: 'FUNCIONAL',
    totalClasses: 10,
    unitValue: 30000,
    totalValue: 300000,
    attendance: [
      { date: '2026-03-10', classNumber: 1 },
      { date: '2026-03-12', classNumber: 2 },
      { date: '2026-03-14', classNumber: 3 },
      { date: '2026-03-15', classNumber: 4 },
      { date: '2026-03-16', classNumber: 5 },
      { date: '2026-03-19', classNumber: 6 },
      { date: '2026-03-21', classNumber: 7 },
      { date: '2026-03-22', classNumber: 8 },
    ],
  },
  {
    id: '2',
    name: 'CAMILA ROMERO',
    cedula: '5678',
    program: 'PILATEX',
    totalClasses: 15,
    unitValue: 35000,
    totalValue: 525000,
    attendance: [
      { date: '2026-03-10', classNumber: 1 },
      { date: '2026-03-12', classNumber: 2 },
      { date: '2026-03-14', classNumber: 3 },
      { date: '2026-03-15', classNumber: 4 },
      { date: '2026-03-19', classNumber: 5 },
      { date: '2026-03-21', classNumber: 6 },
      { date: '2026-03-22', classNumber: 7 },
    ],
  },
  {
    id: '3',
    name: 'CAROLINA ROMERO',
    cedula: '9101',
    program: 'RUMBA',
    totalClasses: 20,
    unitValue: 25000,
    totalValue: 500000,
    attendance: [
      { date: '2026-03-10', classNumber: 1 },
      { date: '2026-03-12', classNumber: 2 },
      { date: '2026-03-14', classNumber: 3 },
      { date: '2026-03-15', classNumber: 4 },
      { date: '2026-03-16', classNumber: 5 },
      { date: '2026-03-19', classNumber: 6 },
      { date: '2026-03-21', classNumber: 7 },
      { date: '2026-03-22', classNumber: 8 },
      { date: '2026-03-23', classNumber: 9 },
      { date: '2026-03-24', classNumber: 10 },
    ],
  },
];

export function useClients() {
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialClients;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const addClient = (client: Omit<Client, 'id' | 'attendance'>) => {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      attendance: [],
    };
    setClients((prev) => [...prev, newClient]);
  };

  const registerAttendance = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        if (c.attendance.length >= c.totalClasses) return c;
        return {
          ...c,
          attendance: [
            ...c.attendance,
            {
              date: new Date().toISOString().split('T')[0],
              classNumber: c.attendance.length + 1,
            },
          ],
        };
      })
    );
  };

  const deleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  return { clients, addClient, registerAttendance, deleteClient };
}
