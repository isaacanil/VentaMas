import type {
  HrEmployeeDepositAccount,
  HrEmployeeDepositAccountType,
} from '@/types/hrPayroll';

const ACCOUNT_TYPE_VALUES = new Set<HrEmployeeDepositAccountType>([
  'checking',
  'savings',
  'payroll',
  'other',
]);

export const HR_DEPOSIT_ACCOUNT_TYPE_LABELS: Record<
  HrEmployeeDepositAccountType,
  string
> = {
  checking: 'Corriente',
  savings: 'Ahorros',
  payroll: 'Nómina',
  other: 'Otra',
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const normalizeHrDepositAccountType = (
  value: unknown,
): HrEmployeeDepositAccountType | null => {
  const normalized = toCleanString(value)?.toLowerCase();
  return normalized && ACCOUNT_TYPE_VALUES.has(normalized as HrEmployeeDepositAccountType)
    ? (normalized as HrEmployeeDepositAccountType)
    : null;
};

export const normalizeHrDepositAccount = (
  value: unknown,
): HrEmployeeDepositAccount | null => {
  const source = asRecord(value);
  const bankName = toCleanString(source.bankName);
  const accountType = normalizeHrDepositAccountType(source.accountType);
  const accountNumber = toCleanString(source.accountNumber);
  const holderName = toCleanString(source.holderName);
  const holderDocument = toCleanString(source.holderDocument);
  const notes = toCleanString(source.notes);

  if (
    !bankName &&
    !accountNumber &&
    !holderName &&
    !holderDocument &&
    !notes
  ) {
    return null;
  }

  return {
    ...(bankName ? { bankName } : {}),
    ...(accountType ? { accountType } : {}),
    ...(accountNumber ? { accountNumber } : {}),
    ...(holderName ? { holderName } : {}),
    ...(holderDocument ? { holderDocument } : {}),
    ...(notes ? { notes } : {}),
  };
};

export const getHrDepositAccountValidationMessage = (
  value: unknown,
): string | null => {
  const source = normalizeHrDepositAccount(value);
  if (!source) return null;
  if (!source.bankName) return 'Indica el banco de la cuenta destino.';
  if (!source.accountNumber) return 'Indica el número de la cuenta destino.';
  return null;
};

const getAccountLast4 = (accountNumber?: string | null): string | null => {
  const digits = toCleanString(accountNumber)?.replace(/\D/g, '') ?? '';
  if (!digits) return null;
  return digits.slice(-4);
};

export const maskHrDepositAccountNumber = (
  accountNumber?: string | null,
): string | null => {
  const last4 = getAccountLast4(accountNumber);
  return last4 ? `****${last4}` : null;
};

export const formatHrDepositAccount = ({
  depositAccount,
  emptyText = 'Sin cuenta destino',
  paymentDestination,
  revealSensitive = false,
}: {
  depositAccount?: HrEmployeeDepositAccount | null;
  emptyText?: string;
  paymentDestination?: string | null;
  revealSensitive?: boolean;
}): string => {
  const account = normalizeHrDepositAccount(depositAccount);
  if (account?.bankName && account.accountNumber) {
    const accountNumber = revealSensitive
      ? account.accountNumber
      : maskHrDepositAccountNumber(account.accountNumber);
    return [
      account.bankName,
      account.accountType
        ? HR_DEPOSIT_ACCOUNT_TYPE_LABELS[account.accountType]
        : null,
      accountNumber,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return toCleanString(paymentDestination) ?? emptyText;
};
