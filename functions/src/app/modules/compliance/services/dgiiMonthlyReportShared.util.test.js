import { describe, expect, it } from 'vitest';

import {
  buildIssueSummary,
  isRecord,
  resolveFiscalDocumentNumber,
  resolveMonthlyPeriodRange,
  toCleanString,
  toDate,
  toFiniteNumber,
} from './dgiiMonthlyReportShared.util.js';

describe('dgiiMonthlyReportShared.util', () => {
  it('identifica objetos record sin aceptar null ni arrays', () => {
    expect(isRecord({ id: 'record-1' })).toBe(true);
    expect(isRecord(new Date('2026-04-05T00:00:00.000Z'))).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(['record-1'])).toBe(false);
  });

  it('normaliza strings limpios sin convertir otros tipos no soportados', () => {
    expect(toCleanString('  B0100000015  ')).toBe('B0100000015');
    expect(toCleanString(15)).toBe('15');
    expect(toCleanString('   ')).toBeNull();
    expect(toCleanString(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toCleanString({ value: 'B0100000015' })).toBeNull();
  });

  it('normaliza numeros finitos desde number y string', () => {
    expect(toFiniteNumber(125.5)).toBe(125.5);
    expect(toFiniteNumber(' 125.50 ')).toBe(125.5);
    expect(toFiniteNumber('')).toBeNull();
    expect(toFiniteNumber('no-number')).toBeNull();
    expect(toFiniteNumber(Number.NaN)).toBeNull();
  });

  it('resuelve el número fiscal desde e-CF, legacy NCF y snapshots canónicos', () => {
    expect(
      resolveFiscalDocumentNumber({
        electronicTaxReceipt: { eNcf: 'E310000000123' },
        NCF: 'B0100000001',
      }),
    ).toBe('E310000000123');
    expect(
      resolveFiscalDocumentNumber({
        snapshot: { ncf: { code: 'E330000000007' } },
      }),
    ).toBe('E330000000007');
    expect(resolveFiscalDocumentNumber({ NCF: 'B0100000001' })).toBe(
      'B0100000001',
    );
  });

  it('normaliza fechas desde los formatos usados por Firestore y fixtures', () => {
    const date = new Date('2026-04-05T13:20:00.000Z');

    expect(toDate(date)).toBe(date);
    expect(toDate({ toDate: () => date })).toBe(date);
    expect(toDate({ toMillis: () => date.getTime() })?.toISOString()).toBe(
      '2026-04-05T13:20:00.000Z',
    );
    expect(toDate(date.getTime())?.toISOString()).toBe(
      '2026-04-05T13:20:00.000Z',
    );
    expect(toDate('2026-04-05T13:20:00.000Z')?.toISOString()).toBe(
      '2026-04-05T13:20:00.000Z',
    );
    expect(
      toDate({ seconds: 1775395200, nanoseconds: 123456789 })?.toISOString(),
    ).toBe('2026-04-05T13:20:00.123Z');
    expect(toDate('not-a-date')).toBeNull();
  });

  it('resuelve el rango mensual UTC y valida el formato YYYY-MM', () => {
    expect(resolveMonthlyPeriodRange(' 2026-04 ')).toEqual({
      periodKey: '2026-04',
      start: new Date('2026-04-01T00:00:00.000Z'),
      endExclusive: new Date('2026-05-01T00:00:00.000Z'),
    });

    expect(() => resolveMonthlyPeriodRange('2026-13')).toThrow(
      'Período mensual inválido: 2026-13',
    );
    expect(() => resolveMonthlyPeriodRange('202604')).toThrow(
      'Período mensual inválido: 202604',
    );
  });

  it('agrupa issues por severidad, fuente y codigo con fallback unknown', () => {
    expect(
      buildIssueSummary([
        {
          severity: 'error',
          sourceId: 'invoice-1',
          code: 'missing_ncf',
        },
        {
          severity: ' error ',
          sourceId: 'invoice-1',
          code: 607,
        },
        {
          severity: '',
          sourceId: null,
          code: undefined,
        },
      ]),
    ).toEqual({
      total: 3,
      bySeverity: {
        error: 2,
        unknown: 1,
      },
      bySource: {
        'invoice-1': 2,
        unknown: 1,
      },
      byCode: {
        missing_ncf: 1,
        607: 1,
        unknown: 1,
      },
    });
  });
});
