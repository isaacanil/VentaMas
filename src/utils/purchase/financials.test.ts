import { describe, expect, it } from 'vitest';

import {
  resolvePurchaseDisplayNextPaymentAt,
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from './financials';

describe('purchase financials', () => {
  it('marks completed cash purchases as paid', () => {
    const purchase = {
      status: 'completed',
      condition: 'cash',
      paymentAt: 1_710_000_000_000,
      replenishments: [
        { quantity: 2, unitCost: 50, calculatedITBIS: 18 },
      ],
      totalAmount: 118,
    };

    const totals = resolvePurchaseMonetaryTotals(purchase);
    const paymentTerms = resolvePurchasePaymentTerms(purchase);
    const paymentState = resolvePurchasePaymentState({
      purchase: { ...purchase, paymentTerms },
      total: totals.total,
    });

    expect(totals).toEqual({
      subtotal: 100,
      taxes: 18,
      total: 118,
    });
    expect(paymentTerms).toMatchObject({
      condition: 'cash',
      expectedPaymentAt: 1_710_000_000_000,
      nextPaymentAt: 1_710_000_000_000,
      isImmediate: true,
      scheduleType: 'immediate',
    });
    expect(paymentState).toMatchObject({
      status: 'paid',
      total: 118,
      paid: 118,
      balance: 0,
      paymentCount: 1,
      nextPaymentAt: null,
    });
  });

  it('marks deferred purchases as unpaid until there is a real payment event', () => {
    const purchase = {
      status: 'pending',
      condition: 'thirty_days',
      paymentAt: 1_710_500_000_000,
      replenishments: [{ quantity: 1, unitCost: 200 }],
    };

    const totals = resolvePurchaseMonetaryTotals(purchase);
    const paymentTerms = resolvePurchasePaymentTerms(purchase);
    const paymentState = resolvePurchasePaymentState({
      purchase: { ...purchase, paymentTerms },
      total: totals.total,
    });

    expect(paymentTerms).toMatchObject({
      condition: 'thirty_days',
      expectedPaymentAt: 1_710_500_000_000,
      nextPaymentAt: 1_710_500_000_000,
      isImmediate: false,
      scheduleType: 'deferred',
    });
    expect(paymentState).toMatchObject({
      status: 'unpaid',
      total: 200,
      paid: 0,
      balance: 200,
      nextPaymentAt: 1_710_500_000_000,
    });
  });

  it('clears stale nextPaymentAt when an existing purchase paymentState is already settled', () => {
    const purchase = {
      status: 'completed',
      paymentState: {
        status: 'paid',
        paid: 118,
        balance: 0,
        nextPaymentAt: 1_711_000_000_000,
      },
      paymentTerms: {
        condition: 'thirty_days',
        expectedPaymentAt: 1_710_500_000_000,
        nextPaymentAt: 1_711_000_000_000,
      },
      replenishments: [{ quantity: 1, unitCost: 100, calculatedITBIS: 18 }],
      totalAmount: 118,
    };

    const totals = resolvePurchaseMonetaryTotals(purchase);
    const paymentState = resolvePurchasePaymentState({
      purchase,
      total: totals.total,
    });

    expect(paymentState).toMatchObject({
      status: 'paid',
      total: 118,
      paid: 118,
      balance: 0,
      nextPaymentAt: null,
    });
    expect(resolvePurchaseDisplayNextPaymentAt(purchase)).toBeNull();
  });
  it('prefers paymentTerms.nextPaymentAt when a partial-payment schedule already exists', () => {
    const purchase = {
      status: 'pending',
      paymentTerms: {
        condition: 'thirty_days',
        expectedPaymentAt: 1_710_500_000_000,
        nextPaymentAt: 1_711_000_000_000,
      },
      replenishments: [{ quantity: 1, unitCost: 120 }],
    };

    const paymentTerms = resolvePurchasePaymentTerms(purchase);

    expect(paymentTerms).toMatchObject({
      expectedPaymentAt: 1_711_000_000_000,
      nextPaymentAt: 1_711_000_000_000,
    });
  });
});
