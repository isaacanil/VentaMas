import { describe, expect, it, vi } from 'vitest';

import type { AccountsReceivablePayment } from '@/utils/accountsReceivable/types';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: {},
}));

import {
  normalizeAccountReceivablePaymentArIds,
  sortAccountReceivablePaymentsByDateDesc,
} from './accountReceivablePayments.repository';

type PaymentFixture = Pick<AccountsReceivablePayment, 'createdAt' | 'date'> & {
  id: string;
};

describe('accountReceivablePayments.repository pure helpers', () => {
  it('normalizes AR ids by trimming, removing empties, and preserving first unique occurrence', () => {
    const arIds = [' ar-2 ', '', 'ar-1', 'ar-2', '  ', '\tar-3\n'];

    expect(normalizeAccountReceivablePaymentArIds(arIds)).toEqual([
      'ar-2',
      'ar-1',
      'ar-3',
    ]);
    expect(arIds).toEqual([' ar-2 ', '', 'ar-1', 'ar-2', '  ', '\tar-3\n']);
  });

  it('sorts payments by date descending and falls back to createdAt', () => {
    const payments: PaymentFixture[] = [
      {
        id: 'date-wins-over-created-at',
        date: '2026-01-02T00:00:00.000Z',
        createdAt: '2030-01-01T00:00:00.000Z',
      },
      {
        id: 'created-at-fallback',
        createdAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'timestamp-like-date',
        date: { toMillis: () => Date.parse('2026-01-04T00:00:00.000Z') },
      },
      {
        id: 'invalid-date-last',
        date: 'not-a-date',
      },
    ];

    const sorted = sortAccountReceivablePaymentsByDateDesc(payments);

    expect(sorted.map((payment) => payment.id)).toEqual([
      'timestamp-like-date',
      'created-at-fallback',
      'date-wins-over-created-at',
      'invalid-date-last',
    ]);
  });

  it('does not mutate the input payment array while sorting', () => {
    const payments: PaymentFixture[] = [
      { id: 'older', date: '2026-01-01T00:00:00.000Z' },
      { id: 'newer', date: '2026-01-02T00:00:00.000Z' },
    ];

    const sorted = sortAccountReceivablePaymentsByDateDesc(payments);

    expect(sorted).not.toBe(payments);
    expect(sorted.map((payment) => payment.id)).toEqual(['newer', 'older']);
    expect(payments.map((payment) => payment.id)).toEqual(['older', 'newer']);
  });
});
