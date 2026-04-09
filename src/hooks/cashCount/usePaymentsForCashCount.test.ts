import { describe, expect, it } from 'vitest';

import type { CashMovement } from '@/types/payments';

import {
  isReceivableCashMovement,
  mapCashMovementToReceivablePayment,
} from './usePaymentsForCashCount';

const baseMovement: CashMovement = {
  id: 'movement-1',
  businessId: 'business-1',
  direction: 'in',
  sourceType: 'receivable_payment',
  sourceId: 'payment-1',
  sourceDocumentId: 'invoice-1',
  sourceDocumentType: 'invoice',
  cashCountId: 'cash-count-1',
  method: 'cash',
  amount: 125,
  counterpartyType: 'client',
  counterpartyId: 'client-1',
  reference: 'REF-1',
  occurredAt: 1_710_000_000_000,
  createdAt: 1_710_000_000_000,
  createdBy: 'user-1',
  impactsCashDrawer: true,
  impactsBankLedger: false,
  status: 'posted',
  metadata: {},
};

describe('isReceivableCashMovement', () => {
  it('accepts posted incoming receivable movements', () => {
    expect(isReceivableCashMovement(baseMovement)).toBe(true);
  });

  it('rejects movements that are not receivable payments', () => {
    expect(
      isReceivableCashMovement({
        ...baseMovement,
        sourceType: 'invoice_pos',
      }),
    ).toBe(false);
  });
});

describe('mapCashMovementToReceivablePayment', () => {
  it('maps a cash movement into the minimal payment shape used by cash count', () => {
    const payment = mapCashMovementToReceivablePayment({
      ...baseMovement,
      method: 'credit_card',
      amount: 250,
    });

    expect(payment).toMatchObject({
      id: 'movement-1',
      amount: 250,
      totalPaid: 250,
      totalAmount: 250,
      createdUserId: 'user-1',
      originType: 'receivable_payment',
      originId: 'payment-1',
      paymentMethods: [
        {
          method: 'credit_card',
          status: true,
          value: 250,
          amount: 250,
          reference: 'REF-1',
        },
      ],
    });
  });
});
