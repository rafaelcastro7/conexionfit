import { describe, expect, it } from 'vitest';
import { parseFlexibleDate, parseSesionesLabel, parseSessionRowsFromPaste } from './parseSessionSheet';

describe('parseSesionesLabel', () => {
  it('sums 20 + 2', () => {
    expect(parseSesionesLabel('20 + 2')).toBe(22);
  });
  it('reads plain number', () => {
    expect(parseSesionesLabel('22')).toBe(22);
  });
});

describe('parseFlexibleDate', () => {
  it('parses Spanish month', () => {
    expect(parseFlexibleDate('05 MARZO 2026')).toBe('2026-03-05');
    expect(parseFlexibleDate('1 Mayo 2026')).toBe('2026-05-01');
  });
  it('parses abbrev', () => {
    expect(parseFlexibleDate('18 FEB 2026')).toBe('2026-02-18');
  });
  it('parses dmy', () => {
    expect(parseFlexibleDate('12-03-2026')).toBe('2026-03-12');
  });
});

describe('parseSessionRowsFromPaste', () => {
  it('parses tab-separated rows', () => {
    const text = '1\t18 FEB 2026\t7:00 pm\tSebas\n2\t05 MARZO 2026\t7:00 pm\tSebas';
    const rows = parseSessionRowsFromPaste(text);
    expect(rows).toHaveLength(2);
    expect(rows[0].classNumber).toBe(1);
    expect(rows[0].dateIso).toBe('2026-02-18');
    expect(rows[0].sessionTime).toBe('7:00 pm');
    expect(rows[0].notes).toBe('Sebas');
    expect(rows[0].sheetSection).toBe('main');
  });

  it('parses ---ADICION--- block', () => {
    const text = '1\t18 FEB 2026\t7:00 pm\t\tA\n---ADICION---\n1\t01 JUN 2026\t6:00 pm\tX\tB';
    const rows = parseSessionRowsFromPaste(text);
    expect(rows).toHaveLength(2);
    expect(rows[0].sheetSection).toBe('main');
    expect(rows[1].sheetSection).toBe('adicional');
    expect(rows[1].signature).toBe('X');
    expect(rows[1].notes).toBe('B');
  });
});
