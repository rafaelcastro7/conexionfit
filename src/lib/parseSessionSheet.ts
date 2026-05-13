/**
 * Planilla Conexion Fit:
 * - Cabecera: NOMBRE, CC, SESIONES, CEL, CORREO, No. FAC, CUMPLE (notas)
 * - Tabla: No. CLASE | FECHA | HORA | FIRMA | OBSERVACIONES
 * - Bloque CLASES DE ADICIÓN: mismas columnas (marcar sección con línea ---ADICION--- o título en línea sola)
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function resolveMonthToken(token: string): number {
  const x = token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const short = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const eng = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const engS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < 12; i++) {
    if (months[i].startsWith(x) || x.startsWith(short[i])) return i + 1;
    if (eng[i].startsWith(x) || x.startsWith(engS[i])) return i + 1;
  }
  return 0;
}

/** "20 + 2" → 22, "22" → 22 */
export function parseSesionesLabel(raw: string): number {
  const t = raw.trim();
  if (!t) return 0;
  const plus = t.match(/(\d+)\s*\+\s*(\d+)/i);
  if (plus) return parseInt(plus[1], 10) + parseInt(plus[2], 10);
  const digits = t.match(/\d+/g);
  if (!digits?.length) return 0;
  return parseInt(digits.join(''), 10) || parseInt(digits[0], 10) || 0;
}

export function normalizeCedula(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function parseFlexibleDate(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad2(parseInt(iso[2], 10))}-${pad2(parseInt(iso[3], 10))}`;

  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmy) {
    let y = parseInt(dmy[3], 10);
    if (y < 100) y += 2000;
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  const withMonth = s.match(/^(\d{1,2})\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\.?\s+(\d{4})$/u);
  if (withMonth) {
    const d = parseInt(withMonth[1], 10);
    const month = resolveMonthToken(withMonth[2]);
    const y = parseInt(withMonth[3], 10);
    if (month && d >= 1 && d <= 31 && y >= 2000) return `${y}-${pad2(month)}-${pad2(d)}`;
  }

  return null;
}

export type SheetSection = 'main' | 'adicional';

export interface ParsedSessionRow {
  classNumber: number;
  dateRaw: string;
  dateIso: string | null;
  sessionTime: string;
  signature: string;
  notes: string;
  sheetSection: SheetSection;
  error?: string;
}

const HEADER_ROW = /^(no\.?\s*clase|#\s*clase)\s*[\t|]/i;
const COLUMN_TITLES = /^(fecha|hora|firma|observaciones)\s*$/i;
const ADICION_BLOCK =
  /^(clases\s+de\s+adici[oó]n|---+\s*adicional\s*---|^---+ADICION---+|###\s*adicional\s*###)\s*$/i;

function splitLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim()).filter(Boolean);
  if (line.includes('|')) return line.split('|').map((c) => c.trim()).filter(Boolean);
  const m = line.match(
    /^(\d+)\s+(.+?)\s+(\d{1,2}:\d{2}\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)?|\d{1,2}\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)|\d{1,2}:\d{2})\s+(.+)$/i
  );
  if (m) return [m[1], m[2].trim(), m[3].trim(), m[4].trim()];
  return line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
}

function mergeDateParts(parts: string[], from: number): { dateRaw: string; nextIdx: number } | null {
  if (from >= parts.length) return null;
  const first = parts[from];
  if (parseFlexibleDate(first)) {
    return { dateRaw: first, nextIdx: from + 1 };
  }
  if (from + 1 < parts.length) {
    const merged = `${parts[from]} ${parts[from + 1]}`;
    if (parseFlexibleDate(merged)) {
      return { dateRaw: merged, nextIdx: from + 2 };
    }
  }
  return { dateRaw: first, nextIdx: from + 1 };
}

/** A partir de FECHA: [hora], [firma?], [obs...] */
function parseTail(tail: string[]): { sessionTime: string; signature: string; notes: string } {
  if (tail.length === 0) return { sessionTime: '', signature: '', notes: '' };
  if (tail.length === 1) return { sessionTime: tail[0], signature: '', notes: '' };
  if (tail.length === 2) return { sessionTime: tail[0], signature: '', notes: tail[1] };
  return { sessionTime: tail[0], signature: tail[1], notes: tail.slice(2).join(' ').trim() };
}

/**
 * Columnas: No. | Fecha | Hora | [Firma] | Observaciones (tab o |).
 * Tras una línea `---ADICION---` o `CLASES DE ADICIÓN` (sola), las filas siguientes van como sección adicional.
 */
export function parseSessionRowsFromPaste(text: string): ParsedSessionRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: ParsedSessionRow[] = [];
  let sheetSection: SheetSection = 'main';

  for (const line of lines) {
    if (ADICION_BLOCK.test(line)) {
      sheetSection = 'adicional';
      continue;
    }
    if (HEADER_ROW.test(line) || COLUMN_TITLES.test(line)) continue;

    const parts = splitLine(line);
    if (parts.length < 3) continue;

    const classNo = parseInt(parts[0].replace(/\D/g, ''), 10);
    if (!classNo || classNo < 1 || classNo > 500) continue;

    const merged = mergeDateParts(parts, 1);
    if (!merged) continue;

    const tail = parts.slice(merged.nextIdx);
    const { sessionTime, signature, notes } = parseTail(tail);

    const dateIso = parseFlexibleDate(merged.dateRaw);
    const error = dateIso ? undefined : `Fecha no reconocida: "${merged.dateRaw}"`;
    out.push({
      classNumber: classNo,
      dateRaw: merged.dateRaw,
      dateIso,
      sessionTime,
      signature,
      notes,
      sheetSection,
      error,
    });
  }

  return out;
}

export interface SessionSheetImportRow {
  classNumber: number;
  dateIso: string;
  sessionTime: string;
  signature: string;
  notes: string;
  sheetSection: SheetSection;
}

export interface SessionSheetImportPayload {
  name: string;
  cedula: string;
  program: string;
  unitValue: number;
  totalSessions: number;
  phone: string;
  email: string;
  invoiceNumber: string;
  sheetNotes: string;
  rows: SessionSheetImportRow[];
}
