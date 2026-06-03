// Tipos de cliente activos viven en src/hooks/useClients.ts (Client, AttendanceRecord).
// Este módulo solo expone constantes compartidas para evitar duplicación.
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

export type Program = (typeof PROGRAMS)[number];
