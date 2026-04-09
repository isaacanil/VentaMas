import {
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
} from '@/utils/purchase/financials';
import { resolvePurchaseWorkflowStatus } from '@/utils/purchase/workflow';
import type { PaymentState } from '@/types/payments';
import type { Purchase } from '@/utils/purchase/types';

const OPEN_BALANCE_THRESHOLD = 0.01;

export const resolvePurchaseOpenPaymentState = (
  purchase: Purchase,
): PaymentState | null => {
  const { total } = resolvePurchaseMonetaryTotals(purchase);
  return (
    resolvePurchasePaymentState({
      purchase,
      total,
    }) ??
    purchase.paymentState ??
    null
  );
};

export const hasOpenAccountsPayableBalance = (purchase: Purchase): boolean => {
  const paymentState = resolvePurchaseOpenPaymentState(purchase);
  const balance = Number(paymentState?.balance ?? 0);
  return Number.isFinite(balance) && balance > OPEN_BALANCE_THRESHOLD;
};

export const isAccountsPayablePurchase = (purchase: Purchase): boolean => {
  if (resolvePurchaseWorkflowStatus(purchase) !== 'completed') {
    return false;
  }

  return hasOpenAccountsPayableBalance(purchase);
};
