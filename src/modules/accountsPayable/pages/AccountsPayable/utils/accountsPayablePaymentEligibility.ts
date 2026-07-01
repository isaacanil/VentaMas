import type { AccountsPayableRow } from './accountsPayableDashboard';

export const ACCOUNTS_PAYABLE_PAYMENT_BALANCE_THRESHOLD = 0.01;

export const hasAccountsPayablePaymentBalance = (
  row: AccountsPayableRow,
): boolean =>
  Number.isFinite(row.balanceAmount) &&
  row.balanceAmount > ACCOUNTS_PAYABLE_PAYMENT_BALANCE_THRESHOLD;

export const isAccountsPayablePaymentEligible = (
  row: AccountsPayableRow,
): boolean =>
  row.paymentControl.canRegisterPayment &&
  hasAccountsPayablePaymentBalance(row);

export const getAccountsPayablePaymentBlockMessage = ({
  canRegisterPayments,
  row,
}: {
  canRegisterPayments: boolean;
  row: AccountsPayableRow;
}): string | null => {
  if (!canRegisterPayments) {
    return 'Tu rol no puede registrar pagos de CxP.';
  }

  if (!row.paymentControl.canRegisterPayment) {
    const reason = row.paymentControl.reason?.trim();

    if (reason) {
      return `${row.paymentControl.label}: ${reason}`;
    }

    return 'Esta cuenta por pagar no está liberada para pago.';
  }

  if (!hasAccountsPayablePaymentBalance(row)) {
    return 'La cuenta por pagar no tiene balance pendiente.';
  }

  return null;
};
