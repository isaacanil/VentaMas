import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildFiscalDate,
  formatFiscalDate,
  getDaysUntil,
  getFiscalCalendarItems,
  parsePeriodStart,
} from './fiscalComplianceCalendar';

describe('fiscalComplianceCalendar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds fiscal dates from the selected period key', () => {
    const periodStart = parsePeriodStart('2026-04');
    expect(periodStart.getFullYear()).toBe(2026);
    expect(periodStart.getMonth()).toBe(3);
    expect(periodStart.getDate()).toBe(1);

    const dueDate = buildFiscalDate('2026-04', 1, 15);
    expect(formatFiscalDate(dueDate)).toBe('15/05/2026');
    expect(formatFiscalDate(new Date(2026, 4, 5))).toBe('05/05/2026');
  });

  it('returns the expected DGII calendar items for a period', () => {
    const items = getFiscalCalendarItems('2026-04');

    expect(
      items.map((item) => ({
        date: formatFiscalDate(item.date),
        label: item.label,
        tone: item.tone,
      })),
    ).toEqual([
      {
        date: '15/05/2026',
        label: 'Envio formatos 606, 607, 608',
        tone: 'warning',
      },
      {
        date: '20/05/2026',
        label: 'Pago ITBIS (IT-1) - Mayo',
        tone: 'warning',
      },
      {
        date: '30/05/2026',
        label: 'Retención ISR asalariados',
        tone: 'success',
      },
      {
        date: '15/06/2026',
        label: 'Envio IR-17 - anticipo',
        tone: 'success',
      },
      {
        date: '28/07/2026',
        label: 'Declaración jurada anual IR-2',
        tone: 'success',
      },
    ]);
  });

  it('calculates day distance using calendar days only', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 10, 23, 45));

    expect(getDaysUntil(new Date(2026, 3, 15, 0, 1))).toBe(5);
    expect(getDaysUntil(new Date(2026, 3, 10, 1, 0))).toBe(0);
    expect(getDaysUntil(new Date(2026, 3, 9, 23, 59))).toBe(-1);
  });
});
