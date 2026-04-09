import {
  ACCOUNTING_CURRENCY_CODES,
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import {
  buildAccountingManualRatesByCurrency,
  createEmptyAccountingRateConfig,
  normalizeAccountingCurrencyRateConfig,
} from '@/utils/accounting/contracts';
import {
  BANK_PAYMENT_MODULE_KEYS,
  BANK_PAYMENT_METHOD_CODES,
  defaultBankPaymentPolicy,
  normalizeBankPaymentPolicy,
  type BankPaymentModuleAssignments,
  type BankPaymentModuleKey,
  type BankPaymentMethodCode,
  type BankPaymentMethodConfig,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';
import type {
  AccountingCurrencyRateConfig,
  AccountingManualRatesByCurrency,
  CurrentExchangeRateIdsByCurrency,
} from '@/types/accounting';

export type { SupportedDocumentCurrency };
export type {
  AccountingCurrencyRateConfig,
  AccountingManualRatesByCurrency,
  CurrentExchangeRateIdsByCurrency,
};
export type {
  BankPaymentModuleAssignments,
  BankPaymentModuleKey,
  BankPaymentMethodCode,
  BankPaymentMethodConfig,
  BankPaymentPolicy,
};

export interface AccountingSettingsConfig {
  schemaVersion: number;
  rolloutMode: 'pilot';
  generalAccountingEnabled: boolean;
  functionalCurrency: SupportedDocumentCurrency;
  documentCurrencies: SupportedDocumentCurrency[];
  exchangeRateMode: 'manual';
  manualRatesByCurrency: AccountingManualRatesByCurrency;
  currentExchangeRateIdsByCurrency: CurrentExchangeRateIdsByCurrency;
  bankAccountsEnabled: boolean;
  bankPaymentPolicy: BankPaymentPolicy;
  overridePolicy: 'settings-only';
  updatedBy: string | null;
}

export interface AccountingSettingsHistoryEntry extends AccountingSettingsConfig {
  id: string;
  changedAt: unknown;
  changedBy: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeFunctionalCurrency = (
  value: unknown,
): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(value, DEFAULT_FUNCTIONAL_CURRENCY);

export const buildManualRatesByCurrency = (
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
  currentRates: AccountingManualRatesByCurrency = {},
): AccountingManualRatesByCurrency =>
  buildAccountingManualRatesByCurrency(
    functionalCurrency,
    documentCurrencies,
    currentRates,
  );

export const getEnabledForeignCurrencies = (
  config: Pick<
    AccountingSettingsConfig,
    'functionalCurrency' | 'documentCurrencies'
  >,
): SupportedDocumentCurrency[] =>
  Array.from(
    new Set([config.functionalCurrency, ...config.documentCurrencies]),
  ).filter((currency) => currency !== config.functionalCurrency);

const normalizeDocumentCurrencies = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
): SupportedDocumentCurrency[] => {
  const rawValues = Array.isArray(value) ? value : [];
  const normalized = rawValues
    .map((item) => toCleanString(item))
    .filter((item): item is SupportedDocumentCurrency =>
      (ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(item),
    );

  const withBaseCurrency = normalized.includes(functionalCurrency)
    ? normalized
    : [functionalCurrency, ...normalized];

  return Array.from(new Set(withBaseCurrency));
};

const normalizeLegacyManualRates = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
): AccountingManualRatesByCurrency => {
  const record = asRecord(value);
  const legacyUsdRate = safeNumber(record.USD);
  const normalizedForeignCurrency = normalizeSupportedDocumentCurrency(
    record.foreignCurrency,
    DEFAULT_FUNCTIONAL_CURRENCY,
  );
  const foreignCurrency =
    normalizedForeignCurrency === functionalCurrency
      ? null
      : normalizedForeignCurrency;

  if (!foreignCurrency) {
    return {};
  }

  return {
    [foreignCurrency]: {
      ...createEmptyAccountingRateConfig(),
      ...normalizeAccountingCurrencyRateConfig({
        buyRate:
          record.buyRate ??
          record.purchase ??
          record.purchaseRate ??
          record.buy,
        sellRate:
          record.sellRate ?? record.sale ?? record.saleRate ?? record.sell,
      }),
      buyRate:
        safeNumber(
          record.buyRate ??
            record.purchase ??
            record.purchaseRate ??
            record.buy,
        ) ?? legacyUsdRate,
      sellRate:
        safeNumber(
          record.sellRate ?? record.sale ?? record.saleRate ?? record.sell,
        ) ?? legacyUsdRate,
    },
  };
};

const buildCurrentExchangeRateIdsByCurrency = (
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
  currentRateIds: CurrentExchangeRateIdsByCurrency = {},
): CurrentExchangeRateIdsByCurrency =>
  Array.from(new Set([functionalCurrency, ...documentCurrencies]))
    .filter((currency) => currency !== functionalCurrency)
    .reduce<CurrentExchangeRateIdsByCurrency>((accumulator, currency) => {
      accumulator[currency] = toCleanString(currentRateIds[currency]) ?? null;
      return accumulator;
    }, {});

const normalizeManualRatesByCurrency = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
): AccountingManualRatesByCurrency => {
  const record = asRecord(value);
  const nestedRates = Object.entries(
    record,
  ).reduce<AccountingManualRatesByCurrency>(
    (accumulator, [currencyKey, nestedValue]) => {
      if (
        !(ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(currencyKey)
      ) {
        return accumulator;
      }

      const normalizedCurrency = currencyKey as SupportedDocumentCurrency;
      if (normalizedCurrency === functionalCurrency) {
        return accumulator;
      }

      const nestedRecord = asRecord(nestedValue);
      accumulator[normalizedCurrency] =
        normalizeAccountingCurrencyRateConfig(nestedRecord);
      return accumulator;
    },
    {},
  );

  const sourceRates =
    Object.keys(nestedRates).length > 0
      ? nestedRates
      : normalizeLegacyManualRates(value, functionalCurrency);

  return buildManualRatesByCurrency(
    functionalCurrency,
    documentCurrencies,
    sourceRates,
  );
};

const normalizeCurrentExchangeRateIdsByCurrency = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
): CurrentExchangeRateIdsByCurrency => {
  const record = asRecord(value);
  const source = Object.entries(
    record,
  ).reduce<CurrentExchangeRateIdsByCurrency>(
    (accumulator, [currencyKey, nestedValue]) => {
      if (
        !(ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(currencyKey)
      ) {
        return accumulator;
      }

      const normalizedCurrency = currencyKey as SupportedDocumentCurrency;
      if (normalizedCurrency === functionalCurrency) {
        return accumulator;
      }

      accumulator[normalizedCurrency] = toCleanString(nestedValue) ?? null;
      return accumulator;
    },
    {},
  );

  return buildCurrentExchangeRateIdsByCurrency(
    functionalCurrency,
    documentCurrencies,
    source,
  );
};

export const defaultAccountingSettings = (
  updatedBy: string | null = null,
): AccountingSettingsConfig => ({
  schemaVersion: 7,
  rolloutMode: 'pilot',
  generalAccountingEnabled: false,
  functionalCurrency: DEFAULT_FUNCTIONAL_CURRENCY,
  documentCurrencies: [DEFAULT_FUNCTIONAL_CURRENCY],
  exchangeRateMode: 'manual',
  manualRatesByCurrency: {},
  currentExchangeRateIdsByCurrency: {},
  bankAccountsEnabled: true,
  bankPaymentPolicy: defaultBankPaymentPolicy(),
  overridePolicy: 'settings-only',
  updatedBy,
});

export const normalizeAccountingSettings = (
  value: unknown,
  updatedByFallback: string | null = null,
): AccountingSettingsConfig => {
  const record = asRecord(value);
  const defaults = defaultAccountingSettings(updatedByFallback);
  const functionalCurrency = normalizeFunctionalCurrency(
    record.functionalCurrency,
  );
  const documentCurrencies = normalizeDocumentCurrencies(
    record.documentCurrencies,
    functionalCurrency,
  );

  return {
    schemaVersion: 7,
    rolloutMode: 'pilot',
    generalAccountingEnabled: record.generalAccountingEnabled === true,
    functionalCurrency,
    documentCurrencies,
    exchangeRateMode: 'manual',
    manualRatesByCurrency: normalizeManualRatesByCurrency(
      record.manualRatesByCurrency ?? record.manualRates,
      functionalCurrency,
      documentCurrencies,
    ),
    currentExchangeRateIdsByCurrency: normalizeCurrentExchangeRateIdsByCurrency(
      record.currentExchangeRateIdsByCurrency,
      functionalCurrency,
      documentCurrencies,
    ),
    bankAccountsEnabled: record.bankAccountsEnabled !== false,
    bankPaymentPolicy: normalizeBankPaymentPolicy(record.bankPaymentPolicy),
    overridePolicy: 'settings-only',
    updatedBy: toCleanString(record.updatedBy) ?? defaults.updatedBy,
  };
};

export const normalizeAccountingHistoryEntry = (
  id: string,
  value: unknown,
  updatedByFallback: string | null = null,
): AccountingSettingsHistoryEntry => {
  const record = asRecord(value);
  const config = normalizeAccountingSettings(record, updatedByFallback);

  return {
    id,
    ...config,
    changedAt: record.changedAt ?? record.updatedAt ?? null,
    changedBy: toCleanString(record.changedBy ?? record.updatedBy) ?? null,
  };
};

export const serializeAccountingConfigForComparison = (
  config: AccountingSettingsConfig,
): string =>
  JSON.stringify({
    generalAccountingEnabled: config.generalAccountingEnabled,
    functionalCurrency: config.functionalCurrency,
    documentCurrencies: [...config.documentCurrencies].sort(),
    bankAccountsEnabled: config.bankAccountsEnabled,
    manualRatesByCurrency: Object.fromEntries(
      Object.entries(config.manualRatesByCurrency)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, rates]) => [
          currency,
          {
            buyRate: rates?.buyRate ?? null,
            sellRate: rates?.sellRate ?? null,
          },
        ]),
    ),
    bankPaymentPolicy: Object.fromEntries([
      [
        'defaultBankAccountId',
        config.bankPaymentPolicy.defaultBankAccountId ?? null,
      ],
      [
        'moduleOverrides',
        Object.fromEntries(
          BANK_PAYMENT_MODULE_KEYS.map((moduleKey) => [
            moduleKey,
            {
              enabled:
                config.bankPaymentPolicy.moduleOverrides[moduleKey].enabled,
              bankAccountId:
                config.bankPaymentPolicy.moduleOverrides[moduleKey]
                  .bankAccountId ?? null,
            },
          ]),
        ),
      ],
      ...BANK_PAYMENT_METHOD_CODES.map((method) => [
        method,
        {
          selectionMode: 'default',
          defaultBankAccountId:
            config.bankPaymentPolicy.defaultBankAccountId ?? null,
        },
      ]),
    ] satisfies Array<[string, unknown]>),
    overridePolicy: config.overridePolicy,
  });
