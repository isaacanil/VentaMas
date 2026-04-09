import type {
  AccountsReceivablePaymentReceipt as AccountsReceivablePaymentReceiptData,
} from '@/utils/accountsReceivable/types';
import type { UserIdentity, UserWithBusiness } from '@/types/users';

import type {
  AutoCompleteTarget,
  PaymentDetails,
  ProcessedPaymentReceipt,
  ReceiptAccount,
  SubmitPaymentDetails,
  SubmitPaymentOption,
  SubmitPaymentScope,
} from './paymentFormTypes';

/** Balance threshold (same as arPaymentUtils) */
const AR_BALANCE_THRESHOLD = 0.01;

const normalizeString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : null;
};

const toValidNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isSubmitPaymentScope = (value: string): value is SubmitPaymentScope =>
  value === 'balance' || value === 'account';

const isSubmitPaymentOption = (value: string): value is SubmitPaymentOption =>
  value === 'installment' || value === 'balance' || value === 'partial';

const isPreorderReceiptAccount = (account?: ReceiptAccount | null): boolean => {
  if (!account) return false;
  if (account.documentType === 'preorder') return true;
  return normalizeString(account.documentLabel)?.toUpperCase() === 'PREVENTA';
};

const getReceiptAccounts = (
  receiptData: ProcessedPaymentReceipt | null,
): ReceiptAccount[] => {
  if (
    !receiptData ||
    typeof receiptData !== 'object' ||
    !('accounts' in receiptData) ||
    !Array.isArray(receiptData.accounts)
  ) {
    return [];
  }

  return receiptData.accounts as ReceiptAccount[];
};

const getReceiptTotalAmount = (
  receiptData: ProcessedPaymentReceipt | null,
): number => {
  if (
    !receiptData ||
    typeof receiptData !== 'object' ||
    !('totalAmount' in receiptData)
  ) {
    return 0;
  }

  return toValidNumber((receiptData as { totalAmount?: unknown }).totalAmount);
};

export const isUserWithBusiness = (
  value: UserIdentity | null,
): value is UserWithBusiness =>
  typeof value?.businessID === 'string' && value.businessID.trim().length > 0;

export const toSubmitPaymentDetails = (
  details: PaymentDetails,
): SubmitPaymentDetails => {
  if (!isSubmitPaymentScope(details.paymentScope)) {
    throw new Error('El tipo de pago no es válido para procesar la transacción.');
  }

  const normalizedPaymentScope: SubmitPaymentScope = details.paymentScope;
  let normalizedPaymentOption: SubmitPaymentOption | undefined;
  if (details.paymentOption) {
    if (!isSubmitPaymentOption(details.paymentOption)) {
      throw new Error(
        'La opción de pago no es válida para procesar la transacción.',
      );
    }
    normalizedPaymentOption = details.paymentOption;
  }

  return {
    ...details,
    paymentScope: normalizedPaymentScope,
    paymentOption: normalizedPaymentOption,
    totalAmount: details.totalAmount,
  };
};

export const shouldAutoCompletePreorder = (
  details: PaymentDetails,
  receiptData: ProcessedPaymentReceipt | null,
): AutoCompleteTarget | null => {
  const accounts = getReceiptAccounts(receiptData);
  if (!accounts.length) return null;

  // Debe ser el último pago de la(s) cuenta(s) impactada(s).
  const allPaid = accounts.every(
    (account) => Number(account.arBalance ?? 1) <= AR_BALANCE_THRESHOLD,
  );
  if (!allPaid) return null;

  const sourceAccount =
    accounts.find((account) => isPreorderReceiptAccount(account)) ?? accounts[0];

  // Prioridad 1: metadata de apertura del modal.
  if (details.originType === 'preorder' || details.preorderId) {
    const preorderId = normalizeString(details.preorderId ?? details.originId);
    if (preorderId) {
      return {
        preorderId,
        arNumber: sourceAccount?.arNumber,
        sourceDocumentLabel:
          normalizeString(sourceAccount?.documentLabel) ?? 'PREVENTA',
        sourceDocumentNumber:
          sourceAccount?.documentNumber ?? sourceAccount?.invoiceNumber ?? null,
        paidAmount: toValidNumber(
          getReceiptTotalAmount(receiptData) || details.totalPaid,
        ),
      };
    }
  }

  // Prioridad 2: datos del recibo (fallback para flujos viejos).
  const preorderAccount = accounts.find(
    (account) =>
      isPreorderReceiptAccount(account) && normalizeString(account.invoiceId),
  );
  const preorderIdFromReceipt = normalizeString(preorderAccount?.invoiceId);
  if (!preorderIdFromReceipt) return null;

  return {
    preorderId: preorderIdFromReceipt,
    arNumber: preorderAccount?.arNumber,
    sourceDocumentLabel:
      normalizeString(preorderAccount?.documentLabel) ?? 'PREVENTA',
    sourceDocumentNumber:
      preorderAccount?.documentNumber ?? preorderAccount?.invoiceNumber ?? null,
    paidAmount: toValidNumber(getReceiptTotalAmount(receiptData) || details.totalPaid),
  };
};

export const isPrintableReceipt = (
  receiptData: ProcessedPaymentReceipt | null,
): receiptData is AccountsReceivablePaymentReceiptData => {
  if (!receiptData || typeof receiptData !== 'object') return false;

  const hasLegacyShape =
    'account' in receiptData &&
    'receiptNumber' in receiptData &&
    'payment' in receiptData &&
    'installmentsPaid' in receiptData &&
    'client' in receiptData;

  // Soporta el formato actual del recibo AR (accounts + paymentMethod + id/receiptId)
  const hasAccounts =
    'accounts' in receiptData && Array.isArray(receiptData.accounts);
  const hasPaymentMethods =
    ('paymentMethod' in receiptData &&
      Array.isArray(
        (receiptData as { paymentMethod?: unknown }).paymentMethod,
      )) ||
    ('paymentMethods' in receiptData &&
      Array.isArray(
        (receiptData as { paymentMethods?: unknown }).paymentMethods,
      ));
  const hasReceiptIdentifier =
    'receiptId' in receiptData || 'receiptNumber' in receiptData || 'id' in receiptData;

  return hasLegacyShape || (hasAccounts && hasPaymentMethods && hasReceiptIdentifier);
};
