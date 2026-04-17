import type {
  BankAccount,
  BankAccountStatus,
  BankAccountType,
} from '@/types/accounting';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import {
  CUSTOM_BANK_INSTITUTION_CODE,
  DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
  findBankInstitutionByName,
  normalizeBankInstitutionCode,
  resolveBankInstitution,
  type BankInstitutionCatalogEntry,
} from '@/domain/banking/bankInstitutionCatalog';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeBankAccountStatus = (value: unknown): BankAccountStatus =>
  value === 'inactive' ? 'inactive' : 'active';

const normalizeBankAccountType = (value: unknown): BankAccountType | null => {
  if (typeof value !== 'string') return null;
  switch (value.trim().toLowerCase()) {
    case 'checking':
    case 'savings':
    case 'credit_card':
    case 'other':
      return value.trim().toLowerCase() as BankAccountType;
    default:
      return null;
  }
};

export interface BankAccountDraft {
  name: string;
  currency: SupportedDocumentCurrency;
  type?: BankAccountType | null;
  institutionName?: string | null;
  countryCode?: string | null;
  bankCode?: string | null;
  isCustomBank?: boolean | null;
  institutionCustomName?: string | null;
  accountNumberLast4?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: unknown;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

interface BankAccountCatalogOptions {
  bankInstitutionCatalog?: readonly BankInstitutionCatalogEntry[];
}

const normalizeCountryCode = (value: unknown): string =>
  toCleanString(value)?.toUpperCase() ?? DEFAULT_BANK_INSTITUTION_COUNTRY_CODE;

const removeLegacyInstitutionCatalogMetadata = (
  metadata?: Record<string, unknown>,
): Record<string, unknown> => {
  const nextMetadata = { ...(metadata ?? {}) };
  delete nextMetadata.institutionCatalog;
  return nextMetadata;
};

export const normalizeBankAccountDraft = (
  value: Partial<BankAccountDraft> | null | undefined,
  options: BankAccountCatalogOptions = {},
): BankAccountDraft => {
  const record = asRecord(value);
  const bankInstitutionCatalog = options.bankInstitutionCatalog ?? [];
  const metadata = asRecord(record.metadata);
  const accountNumberLast4Raw =
    toCleanString(record.accountNumberLast4) ?? toCleanString(record.last4);
  const accountNumberDigits = accountNumberLast4Raw?.replace(/\D/g, '') ?? '';
  const countryCode = normalizeCountryCode(
    record.countryCode ?? record.institutionCountryCode,
  );
  const bankCode = normalizeBankInstitutionCode(
    toCleanString(record.bankCode ?? record.institutionCode),
  );
  const isCustomBank =
    typeof record.isCustomBank === 'boolean'
      ? record.isCustomBank
      : bankCode === CUSTOM_BANK_INSTITUTION_CODE;
  const institutionCustomName = toCleanString(record.institutionCustomName);

  if (isCustomBank) {
    const institutionName =
      institutionCustomName ??
      toCleanString(record.institutionName ?? record.bankName);

    if (!institutionName) {
      throw new Error('Ingrese el nombre del banco personalizado.');
    }

    return {
      name: toCleanString(record.name) ?? '',
      currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
      type: normalizeBankAccountType(record.type),
      institutionName,
      countryCode,
      bankCode: CUSTOM_BANK_INSTITUTION_CODE,
      isCustomBank: true,
      institutionCustomName: institutionName,
      accountNumberLast4: accountNumberDigits
        ? accountNumberDigits.slice(-4)
        : null,
      openingBalance: safeNumber(record.openingBalance),
      openingBalanceDate: record.openingBalanceDate
        ? toTimestamp(record.openingBalanceDate)
        : null,
      notes: toCleanString(record.notes),
      metadata: removeLegacyInstitutionCatalogMetadata(metadata),
    };
  }

  if (!bankInstitutionCatalog.length) {
    throw new Error(
      'El catalogo bancario no esta disponible. Reintente o seleccione Otro banco.',
    );
  }

  const resolvedInstitution = resolveBankInstitution(
    bankInstitutionCatalog,
    countryCode,
    bankCode,
  );

  if (!resolvedInstitution) {
    throw new Error('Seleccione un banco valido del catalogo.');
  }

  return {
    name: toCleanString(record.name) ?? '',
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    type: normalizeBankAccountType(record.type),
    institutionName: resolvedInstitution.name,
    countryCode: resolvedInstitution.countryCode,
    bankCode: resolvedInstitution.code,
    isCustomBank: false,
    institutionCustomName: null,
    accountNumberLast4: accountNumberDigits
      ? accountNumberDigits.slice(-4)
      : null,
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate
      ? toTimestamp(record.openingBalanceDate)
      : null,
    notes: toCleanString(record.notes),
    metadata: removeLegacyInstitutionCatalogMetadata(metadata),
  };
};

export const normalizeBankAccountRecord = (
  id: string,
  businessId: string,
  value: unknown,
  options: BankAccountCatalogOptions = {},
): BankAccount => {
  const record = asRecord(value);
  const bankInstitutionCatalog = options.bankInstitutionCatalog ?? [];
  const metadata = asRecord(record.metadata);
  const institutionCatalogMetadata = asRecord(metadata.institutionCatalog);
  const countryCode = normalizeCountryCode(
    record.countryCode ?? institutionCatalogMetadata.countryCode,
  );
  const bankCode = normalizeBankInstitutionCode(
    toCleanString(record.bankCode ?? institutionCatalogMetadata.bankCode),
  );
  const rawInstitutionName = toCleanString(
    record.institutionName ?? record.bankName,
  );
  const isCustomBank =
    typeof record.isCustomBank === 'boolean'
      ? record.isCustomBank
      : institutionCatalogMetadata.isCustom === true ||
        bankCode === CUSTOM_BANK_INSTITUTION_CODE;
  const resolvedInstitution = isCustomBank
    ? null
    : resolveBankInstitution(bankInstitutionCatalog, countryCode, bankCode) ??
      findBankInstitutionByName(
        bankInstitutionCatalog,
        rawInstitutionName,
        countryCode,
      );
  const institutionName = isCustomBank
    ? rawInstitutionName ?? toCleanString(institutionCatalogMetadata.customName)
    : resolvedInstitution?.name ?? rawInstitutionName;

  return {
    id,
    businessId,
    name: toCleanString(record.name) ?? 'Cuenta bancaria',
    currency: String(record.currency ?? 'DOP')
      .trim()
      .toUpperCase() as SupportedDocumentCurrency,
    status: normalizeBankAccountStatus(record.status),
    type: normalizeBankAccountType(record.type),
    institutionName,
    bankCode: isCustomBank
      ? CUSTOM_BANK_INSTITUTION_CODE
      : (resolvedInstitution?.code ?? bankCode),
    countryCode,
    isCustomBank,
    accountNumberLast4: toCleanString(record.accountNumberLast4 ?? record.last4),
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate ?? null,
    createdAt: (record.createdAt as BankAccount['createdAt']) ?? null,
    updatedAt: (record.updatedAt as BankAccount['updatedAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    updatedBy: toCleanString(record.updatedBy),
    lastChangeId: toCleanString(record.lastChangeId),
    lastChangedAt: (record.lastChangedAt as BankAccount['lastChangedAt']) ?? null,
    notes: toCleanString(record.notes),
    metadata,
  };
};

export const getBankAccountDraftFormValues = (
  account?:
    | Pick<
        BankAccount,
        'institutionName' | 'metadata' | 'bankCode' | 'countryCode' | 'isCustomBank'
      >
    | null,
  options: BankAccountCatalogOptions = {},
) => {
  const bankInstitutionCatalog = options.bankInstitutionCatalog ?? [];
  const metadata = asRecord(account?.metadata);
  const institutionCatalogMetadata = asRecord(metadata.institutionCatalog);
  const countryCode = normalizeCountryCode(
    account?.countryCode ?? institutionCatalogMetadata.countryCode,
  );
  const rawBankCode = normalizeBankInstitutionCode(
    toCleanString(account?.bankCode ?? institutionCatalogMetadata.bankCode),
  );
  const catalogInstitution = resolveBankInstitution(
    bankInstitutionCatalog,
    countryCode,
    rawBankCode,
  );
  if (
    account?.isCustomBank === true ||
    rawBankCode === CUSTOM_BANK_INSTITUTION_CODE
  ) {
    return {
      countryCode,
      bankCode: CUSTOM_BANK_INSTITUTION_CODE,
      isCustomBank: true,
      institutionCustomName:
        toCleanString(institutionCatalogMetadata.customName) ??
        account?.institutionName,
    };
  }

  if (catalogInstitution) {
    return {
      countryCode: catalogInstitution.countryCode,
      bankCode: catalogInstitution.code,
      isCustomBank: false,
      institutionCustomName: null,
    };
  }

  if (rawBankCode) {
    return {
      countryCode,
      bankCode: rawBankCode,
      isCustomBank: false,
      institutionCustomName: null,
    };
  }

  const matchedInstitution = findBankInstitutionByName(
    bankInstitutionCatalog,
    account?.institutionName,
    countryCode,
  );

  if (matchedInstitution) {
    return {
      countryCode: matchedInstitution.countryCode,
      bankCode: matchedInstitution.code,
      isCustomBank: false,
      institutionCustomName: null,
    };
  }

  if (account?.institutionName) {
    return {
      countryCode,
      bankCode: CUSTOM_BANK_INSTITUTION_CODE,
      isCustomBank: true,
      institutionCustomName:
        toCleanString(institutionCatalogMetadata.customName) ??
        account.institutionName,
    };
  }

  return {
    countryCode,
    bankCode: null,
    isCustomBank: null,
    institutionCustomName: null,
  };
};

export const buildBankAccountLabel = (account: BankAccount): string => {
  const bankPrefix = account.institutionName
    ? `${account.institutionName} · `
    : '';
  const last4 = account.accountNumberLast4
    ? ` · ****${account.accountNumberLast4}`
    : '';
  return `${bankPrefix}${account.name} (${account.currency})${last4}`;
};
