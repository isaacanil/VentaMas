import {
  buildPaymentState,
  isSettledPaymentStateStatus,
} from '@/utils/payments/paymentState';
import type { PaymentState } from '@/types/payments';

import type {
  Purchase,
  PurchasePaymentCondition,
  PurchasePaymentTerms,
  PurchaseReplenishment,
} from './types';
import { resolvePurchaseWorkflowStatus } from './workflow';

const IMMEDIATE_PURCHASE_CONDITIONS = new Set<PurchasePaymentCondition>(['cash']);
const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolvePurchaseLineSubtotal = (item: PurchaseReplenishment): number => {
  const unitCost = toFiniteNumber(item.unitCost);
  const quantity =
    toFiniteNumber(item.quantity) ?? toFiniteNumber(item.purchaseQuantity) ?? 0;
  return roundToTwoDecimals(
    toFiniteNumber(item.subtotal) ??
      toFiniteNumber(item.subTotal) ??
      (unitCost != null ? unitCost * quantity : 0),
  );
};

const resolvePurchaseExpectedPaymentAt = (
  purchase: Purchase,
): PurchasePaymentTerms['expectedPaymentAt'] =>
  purchase.paymentTerms?.nextPaymentAt ??
  purchase.paymentTerms?.expectedPaymentAt ??
  purchase.paymentAt ??
  purchase.dates?.paymentDate ??
  null;

const resolvePurchaseCondition = (
  purchase: Purchase,
): PurchasePaymentCondition | null =>
  purchase.paymentTerms?.condition ??
  (toNonEmptyString(purchase.condition) as PurchasePaymentCondition | null);

const isPurchaseCompleted = (purchase: Purchase): boolean => {
  return (
    resolvePurchaseWorkflowStatus(purchase) === 'completed' ||
    purchase.completedAt != null
  );
};

export interface PurchaseMonetaryTotals {
  subtotal: number;
  taxes: number;
  total: number | null;
}

export const resolvePurchaseMonetaryTotals = (
  purchase: Purchase,
): PurchaseMonetaryTotals => {
  const replenishments = Array.isArray(purchase.replenishments)
    ? purchase.replenishments
    : [];
  const subtotal = roundToTwoDecimals(
    replenishments.reduce(
      (sum, item) => sum + resolvePurchaseLineSubtotal(item),
      0,
    ),
  );
  const taxes = roundToTwoDecimals(
    replenishments.reduce(
      (sum, item) => sum + (toFiniteNumber(item.calculatedITBIS) ?? 0),
      0,
    ),
  );
  const total =
    toFiniteNumber(purchase.totalAmount) ??
    toFiniteNumber(purchase.total) ??
    toFiniteNumber(purchase.amount) ??
    (subtotal || taxes ? roundToTwoDecimals(subtotal + taxes) : null);

  return {
    subtotal,
    taxes,
    total: total == null ? null : roundToTwoDecimals(total),
  };
};

export const resolvePurchasePaymentTerms = (
  purchase: Purchase,
): PurchasePaymentTerms => {
  const condition = resolvePurchaseCondition(purchase);
  const expectedPaymentAt = resolvePurchaseExpectedPaymentAt(purchase);
  const isImmediate = condition ? IMMEDIATE_PURCHASE_CONDITIONS.has(condition) : false;

  return {
    condition,
    expectedPaymentAt,
    nextPaymentAt: purchase.paymentTerms?.nextPaymentAt ?? expectedPaymentAt,
    isImmediate,
    scheduleType: isImmediate ? 'immediate' : condition ? 'deferred' : 'custom',
  };
};

export const resolvePurchaseDisplayNextPaymentAt = (
  purchase: Purchase,
): PurchasePaymentTerms['nextPaymentAt'] => {
  if (isSettledPaymentStateStatus(purchase.paymentState?.status)) {
    return null;
  }

  return (
    purchase.paymentState?.nextPaymentAt ??
    purchase.paymentTerms?.nextPaymentAt ??
    purchase.paymentTerms?.expectedPaymentAt ??
    null
  );
};

export const resolvePurchasePaymentState = ({
  purchase,
  total,
}: {
  purchase: Purchase;
  total: number | null;
}): PaymentState | null => {
  if (total == null) return null;

  const paymentTerms = resolvePurchasePaymentTerms(purchase);
  if (purchase.paymentState) {
    const paymentState = buildPaymentState({
      ...purchase.paymentState,
      total,
      nextPaymentAt:
        purchase.paymentState.nextPaymentAt ??
        paymentTerms.nextPaymentAt ??
        paymentTerms.expectedPaymentAt,
    });

    if (isSettledPaymentStateStatus(paymentState.status)) {
      return {
        ...paymentState,
        nextPaymentAt: null,
      };
    }

    return paymentState;
  }

  const isImmediate = Boolean(paymentTerms.isImmediate);
  const isCompleted = isPurchaseCompleted(purchase);
  const lastPaymentAt =
    purchase.completedAt ??
    paymentTerms.expectedPaymentAt ??
    purchase.deliveryAt ??
    null;

  if (isImmediate && isCompleted) {
    return buildPaymentState({
      total,
      paid: total,
      balance: 0,
      lastPaymentAt,
      nextPaymentAt: null,
      paymentCount: 1,
    });
  }

  const paymentState = buildPaymentState({
    total,
    paid: 0,
    balance: total,
    nextPaymentAt: paymentTerms.nextPaymentAt ?? paymentTerms.expectedPaymentAt ?? null,
    requiresReview:
      !paymentTerms.nextPaymentAt && !paymentTerms.expectedPaymentAt && !isImmediate,
  });

  if (isSettledPaymentStateStatus(paymentState.status)) {
    return {
      ...paymentState,
      nextPaymentAt: null,
    };
  }

  return paymentState;
};

