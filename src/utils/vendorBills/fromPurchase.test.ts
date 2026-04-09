import { describe, expect, it } from 'vitest';

import type { Purchase } from '@/utils/purchase/types';

import {
  buildVendorBillFromPurchase,
  isOpenVendorBill,
  shouldMaterializeVendorBillFromPurchase,
} from './fromPurchase';

const buildPurchase = (overrides: Partial<Purchase> = {}): Purchase =>
  ({
    id: 'purchase-1',
    numberId: 1,
    status: 'pending',
    workflowStatus: 'pending_receipt',
    condition: 'cash',
    createdAt: new Date('2026-04-06T10:00:00.000Z'),
    paymentTerms: {
      condition: 'cash',
      expectedPaymentAt: new Date('2026-04-06T10:00:00.000Z'),
      nextPaymentAt: new Date('2026-04-06T10:00:00.000Z'),
      isImmediate: true,
      scheduleType: 'immediate',
    },
    paymentState: {
      status: 'unpaid',
      total: 100,
      paid: 0,
      balance: 100,
      lastPaymentAt: null,
      nextPaymentAt: new Date('2026-04-06T10:00:00.000Z'),
      lastPaymentId: null,
      paymentCount: 0,
      requiresReview: false,
    },
    monetary: {
      documentTotals: {
        total: 100,
      },
    },
    ...overrides,
  }) as Purchase;

describe('vendorBills/fromPurchase', () => {
  it('does not materialize a pending purchase without AP activity', () => {
    expect(shouldMaterializeVendorBillFromPurchase(buildPurchase())).toBe(false);
  });

  it('materializes a draft vendor bill when AP activity exists before completion', () => {
    const purchase = buildPurchase({
      paymentState: {
        status: 'partial',
        total: 100,
        paid: 25,
        balance: 75,
        lastPaymentAt: new Date('2026-04-06T12:00:00.000Z'),
        nextPaymentAt: new Date('2026-04-06T10:00:00.000Z'),
        lastPaymentId: 'payment-1',
        paymentCount: 1,
        requiresReview: false,
      },
    });

    expect(shouldMaterializeVendorBillFromPurchase(purchase)).toBe(true);
    expect(buildVendorBillFromPurchase(purchase)).toMatchObject({
      status: 'draft',
      paymentState: {
        status: 'partial',
        paid: 25,
        balance: 75,
      },
    });
  });

  it('preserves a canceled vendor bill when the purchase had already been completed', () => {
    const purchase = buildPurchase({
      status: 'canceled',
      workflowStatus: 'canceled',
      completedAt: new Date('2026-04-06T12:00:00.000Z'),
    });

    expect(shouldMaterializeVendorBillFromPurchase(purchase)).toBe(true);

    expect(buildVendorBillFromPurchase(purchase)).toMatchObject({
      status: 'canceled',
      sourceDocumentId: 'purchase-1',
    });
  });

  it('does not preserve a canceled purchase that never became AP and has no payment history', () => {
    const purchase = buildPurchase({
      status: 'canceled',
      workflowStatus: 'canceled',
    });

    expect(shouldMaterializeVendorBillFromPurchase(purchase)).toBe(false);
    expect(buildVendorBillFromPurchase(purchase)).toBeNull();
  });

  it('shows only posted or partial vendor bills in the main AP view', () => {
    const openPostedBill = buildVendorBillFromPurchase(
      buildPurchase({
        status: 'completed',
        workflowStatus: 'completed',
      }),
    );
    const draftBill = buildVendorBillFromPurchase(
      buildPurchase({
        paymentState: {
          status: 'partial',
          total: 100,
          paid: 25,
          balance: 75,
          lastPaymentAt: new Date('2026-04-06T12:00:00.000Z'),
          nextPaymentAt: new Date('2026-04-06T10:00:00.000Z'),
          lastPaymentId: 'payment-1',
          paymentCount: 1,
          requiresReview: false,
        },
      }),
    );
    const canceledBill = buildVendorBillFromPurchase(
      buildPurchase({
        status: 'canceled',
        workflowStatus: 'canceled',
        completedAt: new Date('2026-04-06T12:00:00.000Z'),
      }),
    );

    expect(openPostedBill).not.toBeNull();
    expect(draftBill).not.toBeNull();
    expect(canceledBill).not.toBeNull();
    expect(isOpenVendorBill(openPostedBill!)).toBe(true);
    expect(isOpenVendorBill(draftBill!)).toBe(false);
    expect(isOpenVendorBill(canceledBill!)).toBe(false);
  });
});
