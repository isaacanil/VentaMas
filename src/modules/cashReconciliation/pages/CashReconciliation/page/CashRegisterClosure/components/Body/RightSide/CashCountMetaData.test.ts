import { describe, expect, it } from 'vitest';

import { CashCountMetaData } from './CashCountMetaData';

describe('CashCountMetaData', () => {
  it('counts card and transfer aliases in receivable payments', () => {
    const meta = CashCountMetaData(
      {
        opening: { banknotes: [] },
        closing: { banknotes: [{ ref: '10', value: 10, quantity: 1 }] },
      },
      [],
      [],
      [
        {
          amount: 100,
          paymentMethods: [{ method: 'credit_card', value: 100 }],
        },
        {
          amount: 40,
          paymentMethods: [{ method: 'bank_transfer', value: 40 }],
        },
        {
          amount: 10,
          paymentMethods: [{ method: 'cash', value: 10 }],
        },
      ],
    );

    expect(meta).toMatchObject({
      totalCard: 100,
      totalTransfer: 40,
      totalReceivables: 150,
      totalRegister: 150,
      totalSystem: 150,
      totalDiscrepancy: 0,
    });
  });

  it('counts invoice payment aliases as register-impacting methods', () => {
    const meta = CashCountMetaData(
      {
        opening: { banknotes: [] },
        closing: { banknotes: [] },
      },
      [
        {
          data: {
            totalPurchase: { value: 125 },
            change: { value: 0 },
            paymentMethod: [
              { method: 'debit_card', status: true, value: 80 },
              { method: 'check', status: true, value: 45 },
            ],
          },
        },
      ],
      [],
      [],
    );

    expect(meta).toMatchObject({
      totalCard: 80,
      totalTransfer: 45,
      totalCharged: 125,
      totalSystem: 125,
      totalRegister: 125,
      totalDiscrepancy: 0,
    });
  });

  it('prefers cash movements for invoice and expense metrics when available', () => {
    const meta = CashCountMetaData(
      {
        opening: { banknotes: [] },
        closing: { banknotes: [{ ref: '5', value: 5, quantity: 3 }] },
      },
      [
        {
          data: {
            totalPurchase: { value: 999 },
            paymentMethod: [{ method: 'transfer', status: true, value: 999 }],
          },
        },
      ],
      [{ amount: 99, payment: { method: 'open_cash' } }],
      [],
      [
        {
          id: 'inv-cash',
          businessId: 'biz-1',
          direction: 'in',
          sourceType: 'invoice_pos',
          sourceId: 'inv-1',
          sourceDocumentId: 'inv-1',
          sourceDocumentType: 'invoice',
          cashCountId: 'cash-1',
          method: 'cash',
          amount: 20,
          occurredAt: Date.now(),
          createdAt: Date.now(),
          impactsCashDrawer: true,
          impactsBankLedger: false,
        },
        {
          id: 'inv-card',
          businessId: 'biz-1',
          direction: 'in',
          sourceType: 'invoice_pos',
          sourceId: 'inv-1',
          sourceDocumentId: 'inv-1',
          sourceDocumentType: 'invoice',
          cashCountId: 'cash-1',
          method: 'card',
          amount: 80,
          occurredAt: Date.now(),
          createdAt: Date.now(),
          impactsCashDrawer: false,
          impactsBankLedger: true,
        },
        {
          id: 'expense-1',
          businessId: 'biz-1',
          direction: 'out',
          sourceType: 'expense',
          sourceId: 'exp-1',
          sourceDocumentId: 'exp-1',
          sourceDocumentType: 'expense',
          cashCountId: 'cash-1',
          method: 'cash',
          amount: 5,
          occurredAt: Date.now(),
          createdAt: Date.now(),
          impactsCashDrawer: true,
          impactsBankLedger: false,
        },
      ],
    );

    expect(meta).toMatchObject({
      totalCard: 80,
      totalTransfer: 0,
      totalCharged: 100,
      totalExpenses: 5,
      totalSystem: 95,
      totalRegister: 95,
      totalDiscrepancy: 0,
    });
  });

  it('falls back per source when only receivable movements are migrated', () => {
    const meta = CashCountMetaData(
      {
        opening: { banknotes: [{ ref: '10', value: 10, quantity: 1 }] },
        closing: { banknotes: [] },
      },
      [
        {
          data: {
            totalPurchase: { value: 60 },
            change: { value: 0 },
            paymentMethod: [{ method: 'transfer', status: true, value: 60 }],
          },
        },
      ],
      [{ amount: 10, payment: { method: 'open_cash' } }],
      [],
      [
        {
          id: 'arp-1',
          businessId: 'biz-1',
          direction: 'in',
          sourceType: 'receivable_payment',
          sourceId: 'pay-1',
          sourceDocumentId: 'inv-2',
          sourceDocumentType: 'invoice',
          cashCountId: 'cash-1',
          method: 'card',
          amount: 40,
          occurredAt: Date.now(),
          createdAt: Date.now(),
          impactsCashDrawer: false,
          impactsBankLedger: true,
        },
      ],
    );

    expect(meta).toMatchObject({
      totalCard: 40,
      totalTransfer: 60,
      totalCharged: 60,
      totalReceivables: 40,
      totalExpenses: 10,
      totalSystem: 100,
      totalRegister: 100,
      totalDiscrepancy: 0,
    });
  });
});
