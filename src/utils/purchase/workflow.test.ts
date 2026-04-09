import { describe, expect, it } from 'vitest';

import {
  canCancelPurchase,
  canCompletePurchase,
  canEditPurchase,
  normalizePurchaseReplenishment,
  resolvePurchaseLineQuantities,
  resolveLegacyPurchaseStatus,
  resolvePurchaseReceiptChanges,
  resolvePurchaseWorkflowStatus,
} from './workflow';

describe('purchase workflow helpers', () => {
  it('initializes draft replenishments as pending receipt', () => {
    const item = normalizePurchaseReplenishment({
      purchaseQuantity: 8,
      quantity: 3,
    });

    expect(item).toMatchObject({
      orderedQuantity: 8,
      receivedQuantity: 0,
      pendingQuantity: 8,
    });
  });

  it('marks purchases with partial received quantity as partial receipt', () => {
    const workflowStatus = resolvePurchaseWorkflowStatus({
      replenishments: [
        {
          orderedQuantity: 10,
          receivedQuantity: 4,
          pendingQuantity: 6,
        },
      ],
    });

    expect(workflowStatus).toBe('partial_receipt');
    expect(resolveLegacyPurchaseStatus(workflowStatus)).toBe('processing');
  });

  it('marks purchases with no pending quantity as completed', () => {
    const workflowStatus = resolvePurchaseWorkflowStatus({
      replenishments: [
        {
          orderedQuantity: 10,
          receivedQuantity: 10,
          pendingQuantity: 0,
        },
      ],
    });

    expect(workflowStatus).toBe('completed');
  });

  it('recomputes the workflow from receipt quantities when the stored workflowStatus is stale', () => {
    const workflowStatus = resolvePurchaseWorkflowStatus({
      workflowStatus: 'pending_receipt',
      replenishments: [
        {
          orderedQuantity: 10,
          receivedQuantity: 10,
          pendingQuantity: 0,
        },
      ],
    });

    expect(workflowStatus).toBe('completed');
  });

  it('recalculates pending quantity when received quantity changes but pending is stale', () => {
    const quantities = resolvePurchaseLineQuantities({
      orderedQuantity: 10,
      receivedQuantity: 5,
      pendingQuantity: 10,
    });

    expect(quantities).toEqual({
      orderedQuantity: 10,
      receivedQuantity: 5,
      pendingQuantity: 5,
    });
  });

  it('only allows operational editing while receipt is pending and unpaid', () => {
    const pendingPurchase = {
      workflowStatus: 'pending_receipt',
      paymentState: { paid: 0 },
    };
    const completedPurchase = {
      workflowStatus: 'completed',
      paymentState: { paid: 0 },
    };
    const partialPurchase = {
      workflowStatus: 'partial_receipt',
      paymentState: { paid: 0 },
    };
    const paidPurchase = {
      workflowStatus: 'pending_receipt',
      paymentState: { paid: 50 },
    };

    expect(canEditPurchase(pendingPurchase)).toBe(true);
    expect(canCompletePurchase(pendingPurchase)).toBe(true);
    expect(canCancelPurchase(pendingPurchase)).toBe(true);

    expect(canEditPurchase(completedPurchase)).toBe(false);
    expect(canCompletePurchase(completedPurchase)).toBe(false);
    expect(canCancelPurchase(completedPurchase)).toBe(false);

    expect(canEditPurchase(partialPurchase)).toBe(false);
    expect(canCompletePurchase(partialPurchase)).toBe(true);
    expect(canCancelPurchase(partialPurchase)).toBe(false);

    expect(canCancelPurchase(paidPurchase)).toBe(false);
  });

  it('calculates receipt deltas and completed backorders', () => {
    const previous = [
      {
        id: 'product-1',
        name: 'Producto 1',
        orderedQuantity: 10,
        receivedQuantity: 4,
        pendingQuantity: 6,
        selectedBackOrders: [{ id: 'bo-1' }],
      },
    ];
    const next = [
      {
        id: 'product-1',
        name: 'Producto 1',
        orderedQuantity: 10,
        receivedQuantity: 10,
        pendingQuantity: 0,
        selectedBackOrders: [{ id: 'bo-1' }],
      },
    ];

    const result = resolvePurchaseReceiptChanges(previous, next);

    expect(result.receiptReplenishments).toHaveLength(1);
    expect(result.receiptReplenishments[0]).toMatchObject({
      quantity: 6,
      purchaseQuantity: 6,
      receivedQuantity: 6,
      pendingQuantity: 0,
    });
    expect(result.completedBackOrderIds).toEqual(['bo-1']);
  });
});
