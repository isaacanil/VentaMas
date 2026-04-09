import { describe, expect, it } from 'vitest';

import {
  applyReceivablePaymentToContext,
  buildAccountsReceivablePaymentState,
} from './receivablePaymentPlan.util.js';

describe('receivablePaymentPlan.util', () => {
  it('builds an unpaid accounts receivable payment snapshot', () => {
    const paymentState = buildAccountsReceivablePaymentState({
      account: {
        totalReceivable: 300,
        totalInstallments: 3,
      },
      balance: 300,
      paymentCount: 0,
      nextPaymentAt: 1_900_000_000_000,
      remainingInstallments: 3,
    });

    expect(paymentState).toEqual({
      status: 'unpaid',
      total: 300,
      paid: 0,
      balance: 300,
      lastPaymentAt: null,
      nextPaymentAt: 1_900_000_000_000,
      lastPaymentId: null,
      paymentCount: 0,
      remainingInstallments: 3,
    });
  });

  it('applies installment mode against only the oldest active installment and updates snapshot fields', () => {
    const now = 1_800_000_000_000;
    const result = applyReceivablePaymentToContext({
      context: {
        account: {
          id: 'ar_1',
          numberId: 10,
          totalReceivable: 300,
          arBalance: 300,
          totalInstallments: 3,
          paidInstallments: [],
          invoiceId: 'inv_1',
          paymentState: {
            total: 300,
            paid: 0,
            balance: 300,
            paymentCount: 0,
          },
        },
        installments: [
          {
            id: 'inst_1',
            installmentNumber: 1,
            installmentBalance: 100,
            installmentDate: 1_800_000_010_000,
          },
          {
            id: 'inst_2',
            installmentNumber: 2,
            installmentBalance: 100,
            installmentDate: 1_800_000_020_000,
          },
          {
            id: 'inst_3',
            installmentNumber: 3,
            installmentBalance: 100,
            installmentDate: 1_800_000_030_000,
          },
        ],
        activeInstallments: [
          {
            id: 'inst_1',
            installmentNumber: 1,
            installmentBalance: 100,
            installmentDate: 1_800_000_010_000,
          },
          {
            id: 'inst_2',
            installmentNumber: 2,
            installmentBalance: 100,
            installmentDate: 1_800_000_020_000,
          },
          {
            id: 'inst_3',
            installmentNumber: 3,
            installmentBalance: 100,
            installmentDate: 1_800_000_030_000,
          },
        ],
        invoice: {
          id: 'inv_1',
          numberID: 5001,
        },
      },
      mode: 'installment',
      remainingAmount: 150,
      paymentId: 'pay_1',
      clientId: 'client_1',
      authUid: 'user_1',
      now,
    });

    expect(result.remainingAmount).toBe(50);
    expect(result.installmentUpdates).toEqual([
      {
        installmentId: 'inst_1',
        payload: {
          installmentBalance: 0,
          isActive: false,
          updatedAt: now,
          updatedBy: 'user_1',
          status: 'paid',
        },
      },
    ]);
    expect(result.installmentPaymentWrites).toEqual([
      {
        installmentPaymentId: 'pay_1_inst_1',
        payload: expect.objectContaining({
          installmentId: 'inst_1',
          paymentId: 'pay_1',
          paymentAmount: 100,
          clientId: 'client_1',
          arId: 'ar_1',
        }),
      },
    ]);
    expect(result.accountUpdate).toEqual({
      arId: 'ar_1',
      payload: {
        arBalance: 200,
        lastPaymentDate: now,
        lastPayment: 100,
        isActive: true,
        isClosed: false,
        paidInstallments: ['inst_1'],
        paymentState: {
          status: 'partial',
          total: 300,
          paid: 100,
          balance: 200,
          lastPaymentAt: now,
          nextPaymentAt: 1_800_000_020_000,
          lastPaymentId: 'pay_1',
          paymentCount: 1,
          remainingInstallments: 2,
        },
      },
    });
  });

  it('applies balance mode across installments until the account is fully closed', () => {
    const now = 1_800_000_000_000;
    const context = {
      account: {
        id: 'ar_2',
        numberId: 11,
        totalReceivable: 300,
        arBalance: 150,
        totalInstallments: 3,
        paidInstallments: ['inst_a'],
        invoiceId: 'inv_2',
        paymentState: {
          total: 300,
          paid: 150,
          balance: 150,
          paymentCount: 1,
        },
      },
      installments: [
        {
          id: 'inst_a',
          installmentNumber: 1,
          installmentBalance: 0,
          installmentDate: 1_700_000_010_000,
        },
        {
          id: 'inst_b',
          installmentNumber: 2,
          installmentBalance: 100,
          installmentDate: 1_800_000_010_000,
        },
        {
          id: 'inst_c',
          installmentNumber: 3,
          installmentBalance: 50,
          installmentDate: 1_800_000_020_000,
        },
      ],
      activeInstallments: [
        {
          id: 'inst_b',
          installmentNumber: 2,
          installmentBalance: 100,
          installmentDate: 1_800_000_010_000,
        },
        {
          id: 'inst_c',
          installmentNumber: 3,
          installmentBalance: 50,
          installmentDate: 1_800_000_020_000,
        },
      ],
      invoice: {
        id: 'inv_2',
        type: 'invoice',
        numberID: 5002,
      },
    };

    const result = applyReceivablePaymentToContext({
      context,
      mode: 'balance',
      remainingAmount: 150,
      paymentId: 'pay_2',
      clientId: 'client_2',
      authUid: 'user_2',
      now,
    });

    expect(result.remainingAmount).toBe(0);
    expect(result.installmentUpdates).toEqual([
      {
        installmentId: 'inst_b',
        payload: {
          installmentBalance: 0,
          isActive: false,
          updatedAt: now,
          updatedBy: 'user_2',
          status: 'paid',
        },
      },
      {
        installmentId: 'inst_c',
        payload: {
          installmentBalance: 0,
          isActive: false,
          updatedAt: now,
          updatedBy: 'user_2',
          status: 'paid',
        },
      },
    ]);
    expect(result.accountUpdate).toEqual({
      arId: 'ar_2',
      payload: {
        arBalance: 0,
        lastPaymentDate: now,
        lastPayment: 150,
        isActive: false,
        isClosed: true,
        paidInstallments: ['inst_a', 'inst_b', 'inst_c'],
        paymentState: {
          status: 'paid',
          total: 300,
          paid: 300,
          balance: 0,
          lastPaymentAt: now,
          nextPaymentAt: null,
          lastPaymentId: 'pay_2',
          paymentCount: 2,
          remainingInstallments: 0,
        },
      },
    });
    expect(result.invoiceAggregate).toEqual({
      invoiceId: 'inv_2',
      invoice: context.invoice,
      amountPaid: 150,
    });
  });
});
