import { describe, expect, it } from 'vitest';

import { generateInstallments } from './generateInstallments.js';

describe('generateInstallments', () => {
  it('assigns the rounding difference to the last installment', () => {
    const installments = generateInstallments({
      ar: {
        id: 'ar-1',
        totalInstallments: 3,
        totalReceivable: 100,
        paymentFrequency: 'monthly',
      },
      user: { uid: 'user-1' },
    });

    expect(installments.map((item) => item.installmentAmount)).toEqual([
      33.33,
      33.33,
      33.34,
    ]);
  });

  it('accepts finite numeric strings from malformed persisted data', () => {
    const installments = generateInstallments({
      ar: {
        id: 'ar-2',
        totalInstallments: '2',
        totalReceivable: '75.5',
        paymentFrequency: 'weekly',
      },
      user: { uid: 'user-2' },
    });

    expect(installments).toHaveLength(2);
    expect(installments.map((item) => item.installmentAmount)).toEqual([
      37.75,
      37.75,
    ]);
  });

  it('returns no installments for non-finite or non-integer totals', () => {
    expect(
      generateInstallments({
        ar: {
          id: 'ar-invalid-amount',
          totalInstallments: 3,
          totalReceivable: Number.NaN,
        },
      }),
    ).toEqual([]);

    expect(
      generateInstallments({
        ar: {
          id: 'ar-invalid-count',
          totalInstallments: 2.5,
          totalReceivable: 100,
        },
      }),
    ).toEqual([]);
  });
});
