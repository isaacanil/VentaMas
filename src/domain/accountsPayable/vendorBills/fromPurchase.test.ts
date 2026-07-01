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
    expect(shouldMaterializeVendorBillFromPurchase(buildPurchase())).toBe(
      false,
    );
  });

  it('does not materialize a completed purchase while inventory receipt is pending', () => {
    const purchase = buildPurchase({
      status: 'completed',
      workflowStatus: 'completed',
      receiptInventoryState: {
        status: 'pending',
        operationId: 'receipt-1',
        warehouseId: 'warehouse-1',
      },
    });

    expect(shouldMaterializeVendorBillFromPurchase(purchase)).toBe(false);
    expect(buildVendorBillFromPurchase(purchase)).toBeNull();
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
      approvalStatus: 'draft',
      paymentControl: {
        canRegisterPayment: false,
        status: 'pending_approval',
      },
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
      status: 'voided',
      approvalStatus: 'voided',
      sourceDocumentId: 'purchase-1',
      paymentControl: {
        canRegisterPayment: false,
        status: 'closed',
      },
    });
  });

  it('projects a completed purchase with AP void control as a closed vendor bill', () => {
    const purchase = buildPurchase({
      status: 'completed',
      workflowStatus: 'completed',
      completedAt: new Date('2026-04-06T12:00:00.000Z'),
      accountsPayable: {
        approvalStatus: 'voided',
        status: 'voided',
        voidedAt: new Date('2026-04-07T12:00:00.000Z'),
        voidedBy: 'user-1',
        voidReason: 'Factura duplicada por suplidor',
        voidEvidenceNote: 'Ticket AP-VOID-1',
        voidEvidenceUrls: ['https://files.example/void.pdf'],
      },
    } as Partial<Purchase>);

    expect(buildVendorBillFromPurchase(purchase)).toMatchObject({
      status: 'voided',
      approvalStatus: 'voided',
      voidedBy: 'user-1',
      voidReason: 'Factura duplicada por suplidor',
      voidEvidenceNote: 'Ticket AP-VOID-1',
      voidEvidenceUrls: ['https://files.example/void.pdf'],
      paymentControl: {
        canRegisterPayment: false,
        status: 'closed',
      },
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

  it('shows approved, held, disputed or partially paid vendor bills in the main AP view', () => {
    const openApprovedBill = buildVendorBillFromPurchase(
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
    const voidedBill = buildVendorBillFromPurchase(
      buildPurchase({
        status: 'canceled',
        workflowStatus: 'canceled',
        completedAt: new Date('2026-04-06T12:00:00.000Z'),
      }),
    );

    expect(openApprovedBill).not.toBeNull();
    expect(draftBill).not.toBeNull();
    expect(voidedBill).not.toBeNull();
    expect(isOpenVendorBill(openApprovedBill!)).toBe(true);
    expect(
      isOpenVendorBill({
        ...openApprovedBill!,
        status: 'on_hold',
        paymentHold: { active: true, reason: 'Pendiente de aprobacion' },
      }),
    ).toBe(true);
    expect(
      isOpenVendorBill({
        ...openApprovedBill!,
        status: 'disputed',
        dispute: { status: 'open', reason: 'Diferencia de precio' },
      }),
    ).toBe(true);
    expect(isOpenVendorBill(draftBill!)).toBe(false);
    expect(isOpenVendorBill(voidedBill!)).toBe(false);
  });
});
