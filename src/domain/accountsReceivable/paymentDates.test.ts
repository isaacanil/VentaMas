import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import {
  calculatePaymentDates,
  formatPaymentDate,
  getFormattedDates,
} from './paymentDates';

describe('paymentDates', () => {
  it('uses the provided start date as the first payment when requested', () => {
    const startDate = DateTime.fromISO('2025-01-15').toMillis();

    const result = calculatePaymentDates('monthly', 3, startDate, {
      includeStartDate: true,
    });

    expect(result.paymentDates).toEqual([
      startDate,
      DateTime.fromMillis(startDate).plus({ months: 1 }).toMillis(),
      DateTime.fromMillis(startDate).plus({ months: 2 }).toMillis(),
    ]);
  });

  it('starts from the next interval by default', () => {
    const startDate = DateTime.fromISO('2025-01-15').toMillis();

    const result = calculatePaymentDates('weekly', 2, startDate);

    expect(result.paymentDates).toEqual([
      DateTime.fromMillis(startDate).plus({ weeks: 1 }).toMillis(),
      DateTime.fromMillis(startDate).plus({ weeks: 2 }).toMillis(),
    ]);
  });

  it('guards against excessive installment generation', () => {
    expect(calculatePaymentDates('monthly', 3000)).toEqual({
      paymentDates: [],
      nextPaymentDate: null,
    });
  });

  it('formats individual and grouped payment dates', () => {
    const firstDate = DateTime.fromISO('2025-03-02').toMillis();
    const secondDate = DateTime.fromISO('2025-04-02').toMillis();

    expect(formatPaymentDate(firstDate)).toBe('02/03/2025');
    expect(getFormattedDates([firstDate, secondDate], 'yyyy-MM-dd')).toEqual([
      '2025-03-02',
      '2025-04-02',
    ]);
    expect(formatPaymentDate(0)).toBe('');
    expect(getFormattedDates(null as never)).toEqual([]);
  });
});
