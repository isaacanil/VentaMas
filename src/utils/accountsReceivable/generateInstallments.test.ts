import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import { generateInstallments } from './generateInstallments';

describe('generateInstallments', () => {
  it('uses the provided paymentDate as the first installment date', () => {
    const paymentDate = DateTime.fromISO('2025-01-15').toMillis();

    const installments = generateInstallments({
      ar: {
        id: 'ar-1',
        totalInstallments: 3,
        totalReceivable: 300,
        paymentFrequency: 'monthly',
        paymentDate,
      },
      user: { uid: 'user-1' } as never,
    });

    expect(installments).toHaveLength(3);
    expect(installments[0]?.installmentDate).toBe(paymentDate);
    expect(installments[1]?.installmentDate).toBe(
      DateTime.fromMillis(paymentDate).plus({ months: 1 }).toMillis(),
    );
  });

  it('assigns the rounding difference to the last installment', () => {
    const installments = generateInstallments({
      ar: {
        id: 'ar-2',
        totalInstallments: 3,
        totalReceivable: 100,
        paymentFrequency: 'monthly',
      },
      user: { uid: 'user-2' } as never,
    });

    expect(installments.map((item) => item.installmentAmount)).toEqual([
      33.33,
      33.33,
      33.34,
    ]);
    expect(
      installments.reduce((sum, item) => sum + item.installmentAmount, 0),
    ).toBe(100);
  });

  it('returns an empty array when totalInstallments is zero or invalid', () => {
    expect(
      generateInstallments({
        ar: {
          id: 'ar-empty',
          totalInstallments: 0,
          totalReceivable: 100,
        } as never,
      }),
    ).toEqual([]);
  });

  it('keeps creator metadata and installment balances aligned with each generated installment', () => {
    const paymentDate = DateTime.fromISO('2025-02-01').toMillis();

    const installments = generateInstallments({
      ar: {
        id: 'ar-3',
        totalInstallments: 2,
        totalReceivable: 75,
        paymentFrequency: 'weekly',
        paymentDate,
      },
      user: { uid: 'user-3' } as never,
    });

    expect(installments).toHaveLength(2);
    expect(installments[0]).toEqual(
      expect.objectContaining({
        arId: 'ar-3',
        installmentNumber: 1,
        installmentDate: paymentDate,
        installmentAmount: 37.5,
        installmentBalance: 37.5,
        createdBy: 'user-3',
        updatedBy: 'user-3',
        isActive: true,
      }),
    );
    expect(installments[1]?.installmentDate).toBe(
      DateTime.fromMillis(paymentDate).plus({ weeks: 1 }).toMillis(),
    );
  });
});
