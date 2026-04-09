import { describe, expect, it } from 'vitest';

import { buildVoidReceivablePaymentPlan } from './receivablePaymentVoid.util.js';

describe('receivablePaymentVoid.util', () => {
  it('restores installment balances and reopens the receivable snapshot on void', () => {
    const now = 1_800_000_100_000;
    const result = buildVoidReceivablePaymentPlan({
      context: {
        account: {
          id: 'ar_1',
          totalReceivable: 300,
          arBalance: 0,
          totalInstallments: 3,
          paidInstallments: ['inst_1', 'inst_2', 'inst_3'],
          lastPayment: 150,
          paymentState: {
            total: 300,
            paid: 300,
            balance: 0,
            paymentCount: 2,
            lastPaymentId: 'pay_2',
          },
          monetary: {
            documentCurrency: { code: 'USD' },
            functionalCurrency: { code: 'DOP' },
            documentTotals: { total: 300, paid: 300, balance: 0 },
            functionalTotals: { total: 17400, paid: 17400, balance: 0 },
          },
        },
        installments: [
          {
            id: 'inst_1',
            installmentAmount: 100,
            installmentBalance: 0,
            installmentDate: 1_800_000_010_000,
          },
          {
            id: 'inst_2',
            installmentAmount: 100,
            installmentBalance: 0,
            installmentDate: 1_800_000_020_000,
          },
          {
            id: 'inst_3',
            installmentAmount: 100,
            installmentBalance: 0,
            installmentDate: 1_800_000_030_000,
          },
        ],
        invoice: {
          id: 'inv_1',
        },
      },
      accountEntry: {
        arId: 'ar_1',
        totalPaid: 100,
        historicalFunctionalSettled: 5800,
        paidInstallments: [{ id: 'inst_3', amount: 100 }],
      },
      paymentId: 'pay_2',
      fallbackLastPaymentAt: 1_800_000_050_000,
      fallbackLastPaymentId: 'pay_1',
      fallbackLastPaymentAmount: 200,
      authUid: 'auditor_1',
      now,
    });

    expect(result.restoredAmount).toBe(100);
    expect(result.installmentUpdates).toEqual([
      {
        installmentId: 'inst_3',
        payload: {
          installmentBalance: 100,
          isActive: true,
          updatedAt: now,
          updatedBy: 'auditor_1',
          status: 'pending',
        },
      },
    ]);
    expect(result.accountUpdate).toEqual({
      arId: 'ar_1',
      payload: {
        arBalance: 100,
        lastPaymentDate: 1_800_000_050_000,
        lastPayment: 200,
        isActive: true,
        isClosed: false,
        paidInstallments: ['inst_1', 'inst_2'],
        paymentState: {
          status: 'partial',
          total: 300,
          paid: 200,
          balance: 100,
          lastPaymentAt: 1_800_000_050_000,
          nextPaymentAt: 1_800_000_030_000,
          lastPaymentId: 'pay_1',
          paymentCount: 1,
          remainingInstallments: 1,
        },
        monetary: {
          documentCurrency: { code: 'USD' },
          functionalCurrency: { code: 'DOP' },
          documentTotals: { total: 300, paid: 200, balance: 100 },
          functionalTotals: { total: 17400, paid: 11600, balance: 5800 },
        },
      },
    });
  });
});
