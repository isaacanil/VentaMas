export interface AccountsPayablePaymentVisibilityOptions {
  includeVoided?: boolean;
}

export interface AccountsPayablePaymentStatusTag {
  color: 'gold' | 'green' | 'red';
  label: string;
}

const HIDDEN_ACCOUNTS_PAYABLE_PAYMENT_STATUSES = new Set(['draft']);
const VOIDED_ACCOUNTS_PAYABLE_PAYMENT_STATUSES = new Set([
  'canceled',
  'cancelled',
  'void',
  'voided',
]);

export const normalizeAccountsPayablePaymentStatus = (
  status?: string | null,
): string =>
  String(status ?? '')
    .trim()
    .toLowerCase();

export const isVoidedAccountsPayablePaymentStatus = (
  status?: string | null,
): boolean =>
  VOIDED_ACCOUNTS_PAYABLE_PAYMENT_STATUSES.has(
    normalizeAccountsPayablePaymentStatus(status),
  );

export const shouldShowAccountsPayablePayment = (
  payment: { status?: string | null },
  options: AccountsPayablePaymentVisibilityOptions = {},
): boolean => {
  const status = normalizeAccountsPayablePaymentStatus(payment.status);

  if (HIDDEN_ACCOUNTS_PAYABLE_PAYMENT_STATUSES.has(status)) {
    return false;
  }

  if (
    options.includeVoided !== true &&
    VOIDED_ACCOUNTS_PAYABLE_PAYMENT_STATUSES.has(status)
  ) {
    return false;
  }

  return true;
};

export const resolveAccountsPayablePaymentAccountingEventType = (
  status?: string | null,
): 'accounts_payable.payment.recorded' | 'accounts_payable.payment.voided' =>
  isVoidedAccountsPayablePaymentStatus(status)
    ? 'accounts_payable.payment.voided'
    : 'accounts_payable.payment.recorded';

export const resolveAccountsPayablePaymentStatusTag = (
  status?: string | null,
): AccountsPayablePaymentStatusTag => {
  if (isVoidedAccountsPayablePaymentStatus(status)) {
    return { color: 'red', label: 'Anulado' };
  }

  if (normalizeAccountsPayablePaymentStatus(status) === 'draft') {
    return { color: 'gold', label: 'Borrador' };
  }

  return { color: 'green', label: 'Registrado' };
};
