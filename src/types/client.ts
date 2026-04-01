export interface AttendanceRecord {
  date: string;
  classNumber: number;
}

export interface Client {
  id: string;
  name: string;
  cedula: string;
  program: string;
  totalClasses: number;
  unitValue: number;
  totalValue: number;
  attendance: AttendanceRecord[];
}

export const PROGRAMS = [
  'FUNCIONAL',
  'PILATEX',
  'RUMBA',
  'CROSSFIT',
  'YOGA',
  'SPINNING',
  'GAP',
  'BOXEO',
] as const;
