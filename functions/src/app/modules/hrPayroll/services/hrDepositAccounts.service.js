export const HR_DEPOSIT_ACCOUNT_TYPES = new Set([
  'checking',
  'savings',
  'payroll',
  'other',
]);

export const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length ? trimmed : null;
};

export const normalizeHrDepositAccountType = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  return normalized && HR_DEPOSIT_ACCOUNT_TYPES.has(normalized)
    ? normalized
    : null;
};

export const normalizeHrDepositAccount = (value) => {
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

export const validateHrDepositAccount = (value) => {
  const account = normalizeHrDepositAccount(value);
  if (!account) return [];

  const errors = [];
  if (!account.bankName) {
    errors.push('banco de cuenta destino es requerido.');
  }
  if (!account.accountNumber) {
    errors.push('numero de cuenta destino es requerido.');
  }
  return errors;
};

export const getHrDepositAccountLast4 = (accountNumber) => {
  const digits = toCleanString(accountNumber)?.replace(/\D/g, '') ?? '';
  return digits ? digits.slice(-4) : null;
};

export const maskHrDepositAccountNumber = (accountNumber) => {
  const last4 = getHrDepositAccountLast4(accountNumber);
  return last4 ? `****${last4}` : null;
};

export const maskHrDepositAccount = (value) => {
  const account = normalizeHrDepositAccount(value);
  if (!account) return null;
  return {
    ...account,
    ...(account.accountNumber
      ? { accountNumber: maskHrDepositAccountNumber(account.accountNumber) }
      : {}),
    ...(account.holderDocument ? { holderDocument: '***' } : {}),
  };
};
