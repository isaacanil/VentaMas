import { describe, expect, it } from 'vitest';

import {
  calculateInvoiceChange,
  getInvoicePaymentInfo,
  getInvoicePaymentState,
  normalizeInvoiceChange,
} from '@/utils/invoice';

describe('normalizeInvoiceChange', () => {
  it('normalizes tiny residual values to zero', () => {
    expect(normalizeInvoiceChange(-0.004)).toBe(0);
    expect(normalizeInvoiceChange(0.004)).toBe(0);
  });

  it('preserves material balances after rounding', () => {
    expect(normalizeInvoiceChange(-0.006)).toBe(-0.01);
  });
});

describe('calculateInvoiceChange', () => {
  it('uses the stored change snapshot when available', () => {
    const change = calculateInvoiceChange({
      change: { value: -0.004 },
      payment: { value: 553.42 },
      totalPurchase: { value: 553.424 },
    });

    expect(change).toBe(0);
  });

  it('normalizes floating point debt when recalculating from totals', () => {
    const change = calculateInvoiceChange({
      payment: { value: 553.42 },
      totalPurchase: { value: 553.424 },
    });

    expect(change).toBe(0);
  });
});

describe('getInvoicePaymentInfo', () => {
  it('prefers accumulatedPaid when present', () => {
    const info = getInvoicePaymentInfo({
      accumulatedPaid: 50,
      totalPurchase: { value: 100 },
    });

    expect(info.paid).toBe(50);
    expect(info.total).toBe(100);
    expect(info.pending).toBe(50);
    expect(info.isPaidInFull).toBe(false);
  });

  it('falls back to payment snapshot net of change when accumulatedPaid is missing', () => {
    const info = getInvoicePaymentInfo({
      payment: { value: 100 },
      change: { value: 10 },
      totalPurchase: { value: 90 },
    });

    expect(info.paid).toBe(90);
    expect(info.total).toBe(90);
    expect(info.pending).toBe(0);
    expect(info.isPaidInFull).toBe(true);
  });
});

describe('getInvoicePaymentState', () => {
  it('builds a normalized payment state from invoice fields', () => {
    const state = getInvoicePaymentState({
      accumulatedPaid: 60,
      totalPurchase: { value: 100 },
      paymentHistory: [
        { date: 1, amount: 10 },
        { date: 2, amount: 50 },
      ],
    });

    expect(state).toEqual({
      status: 'partial',
      total: 100,
      paid: 60,
      balance: 40,
      paymentCount: 2,
      lastPaymentAt: 2,
      nextPaymentAt: null,
      lastPaymentId: null,
    });
    expect(state).not.toHaveProperty('requiresReview');
    expect(state).not.toHaveProperty('migratedFromLegacy');
  });
});
