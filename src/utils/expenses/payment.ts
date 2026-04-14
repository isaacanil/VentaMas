import type { BankAccount } from '@/types/accounting';
import type {
  ExpensePayment,
  ExpensePaymentMethod,
} from '@/utils/expenses/types';

const BANK_PAYMENT_METHODS = new Set<ExpensePaymentMethod>([
  'credit_card',
  'check',
  'bank_transfer',
]);

const asCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const isBankExpensePaymentMethod = (
  value: unknown,
): value is ExpensePaymentMethod =>
  typeof value === 'string' &&
  BANK_PAYMENT_METHODS.has(value as ExpensePaymentMethod);

export const isCashRegisterExpensePaymentMethod = (value: unknown): boolean =>
  value === 'open_cash';

export const resolveExpensePaymentSourceType = (
  method: unknown,
): ExpensePayment['sourceType'] => {
  if (isCashRegisterExpensePaymentMethod(method)) {
    return 'cash_drawer';
  }
  if (method === 'cash') {
    return 'cash';
  }
  if (isBankExpensePaymentMethod(method)) {
    return 'bank';
  }
  return null;
};

export const normalizeExpensePayment = (
  payment: ExpensePayment | null | undefined,
  options: {
    bankAccounts?: BankAccount[];
    defaultBankAccountId?: string | null;
    useBankAccounts?: boolean;
  } = {},
): ExpensePayment => {
  const method = asCleanString(payment?.method) as ExpensePaymentMethod | null;
  const bankAccounts = options.bankAccounts ?? [];
  const useBankAccounts = options.useBankAccounts !== false;
  const resolvedBankAccountId = useBankAccounts
    ? (asCleanString(options.defaultBankAccountId) ??
      asCleanString(payment?.bankAccountId))
    : null;
  const selectedBankAccount = useBankAccounts
    ? (bankAccounts.find((account) => account.id === resolvedBankAccountId) ??
      null)
    : null;
  const bankLabel = useBankAccounts
    ? (selectedBankAccount?.name ??
      selectedBankAccount?.institutionName ??
      asCleanString(payment?.bank))
    : null;

  if (isBankExpensePaymentMethod(method)) {
    return {
      ...payment,
      method,
      sourceType: 'bank',
      cashAccountId: null,
      bankAccountId: resolvedBankAccountId,
      bank: bankLabel,
      cashRegister: null,
      comment: asCleanString(payment?.comment),
      reference: asCleanString(payment?.reference),
    };
  }

  if (isCashRegisterExpensePaymentMethod(method)) {
    return {
      ...payment,
      method,
      sourceType: 'cash_drawer',
      cashAccountId: null,
      cashRegister: asCleanString(payment?.cashRegister),
      bankAccountId: null,
      bank: null,
      comment: asCleanString(payment?.comment),
      reference: asCleanString(payment?.reference),
    };
  }

  if (method === 'cash') {
    return {
      ...payment,
      method,
      sourceType: 'cash',
      cashAccountId: asCleanString(payment?.cashAccountId),
      bankAccountId: null,
      bank: null,
      cashRegister: null,
      comment: asCleanString(payment?.comment),
      reference: asCleanString(payment?.reference),
    };
  }

  return {
    ...payment,
    method,
    sourceType: resolveExpensePaymentSourceType(method),
    cashAccountId: asCleanString(payment?.cashAccountId),
    bankAccountId: asCleanString(payment?.bankAccountId),
    bank: asCleanString(payment?.bank),
    cashRegister: asCleanString(payment?.cashRegister),
    comment: asCleanString(payment?.comment),
    reference: asCleanString(payment?.reference),
  };
};
