import { describe, expect, it } from 'vitest';

import { resolveTimestampMillis } from './documentCurrencyDates';

describe('resolveTimestampMillis', () => {
  it('normaliza los formatos de fecha usados por la configuracion monetaria', () => {
    const date = new Date('2026-06-15T10:30:00.000Z');

    expect(resolveTimestampMillis(date.getTime())).toBe(date.getTime());
    expect(resolveTimestampMillis(date.toISOString())).toBe(date.getTime());
    expect(resolveTimestampMillis(date)).toBe(date.getTime());
    expect(resolveTimestampMillis({ toMillis: () => date.getTime() })).toBe(
      date.getTime(),
    );
    expect(resolveTimestampMillis({ toDate: () => date })).toBe(date.getTime());
    expect(resolveTimestampMillis({ seconds: 1_717_000_000 })).toBe(
      1_717_000_000_000,
    );
    expect(resolveTimestampMillis({ _seconds: 1_717_000_000 })).toBe(
      1_717_000_000_000,
    );
  });

  it('retorna null cuando el valor no puede convertirse a milisegundos', () => {
    expect(resolveTimestampMillis(null)).toBeNull();
    expect(resolveTimestampMillis(Number.NaN)).toBeNull();
    expect(resolveTimestampMillis('fecha invalida')).toBeNull();
    expect(resolveTimestampMillis({ seconds: 'nope' })).toBeNull();
  });
});
