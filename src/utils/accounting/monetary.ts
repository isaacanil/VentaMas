import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type {
  CurrentExchangeRateIdsByCurrency,
  AccountingManualRatesByCurrency,
  AccountingOperationType,
} from '@/types/accounting';
import {
  normalizeBankPaymentPolicy,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';
import {
  buildAccountingManualRatesByCurrency,
  getAccountingRateValue,
  normalizeAccountingCurrencyRateConfig,
  normalizeAccountingRateType,
  resolveAccountingRateTypeForOperation,
} from '@/utils/accounting/contracts';
import {
  ACCOUNTING_CURRENCY_CODES,
  DEFAULT_FUNCTIONAL_CURRENCY,
  isSupportedDocumentCurrency,
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';

const ACCOUNTING_PILOT_BUSINESS_IDS = new Set(['X63aIFwHzk3r0gmT8w6P']);
const ACCOUNTING_SETTINGS_CACHE_MS = 30_000;

interface AccountingSettingsSnapshot {
  rolloutEnabled: boolean;
  functionalCurrency: SupportedDocumentCurrency;
  documentCurrencies: SupportedDocumentCurrency[];
  manualRatesByCurrency: AccountingManualRatesByCurrency;
  currentExchangeRateIdsByCurrency: CurrentExchangeRateIdsByCurrency;
  bankAccountsEnabled: boolean;
  bankPaymentPolicy: BankPaymentPolicy;
  updatedAt: number | null;
}

interface MonetaryTotalsInput {
  subtotal?: unknown;
  discount?: unknown;
  taxes?: unknown;
  total?: unknown;
  paid?: unknown;
  balance?: unknown;
}

interface RequestedMonetaryContext {
  documentCurrency: SupportedDocumentCurrency;
  explicitCurrencyProvided: boolean;
}

const accountingSettingsCache = new Map<
  string,
  {
    expiresAt: number;
    value: AccountingSettingsSnapshot | null;
  }
>();

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toUpperCleanString = (value: unknown): string | null => {
  const normalized = toCleanString(value);
  return normalized ? normalized.toUpperCase() : null;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const normalizeSupportedCurrency = (
  value: unknown,
  fallback: SupportedDocumentCurrency = DEFAULT_FUNCTIONAL_CURRENCY,
): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(value, fallback);

const toTimestampMillis = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const record = value as {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof record.toMillis === 'function') {
      const parsed = record.toMillis();
      return Number.isFinite(parsed) ? parsed : null;
    }
    const seconds =
      typeof record.seconds === 'number'
        ? record.seconds
        : typeof record._seconds === 'number'
          ? record._seconds
          : null;
    const nanoseconds =
      typeof record.nanoseconds === 'number'
        ? record.nanoseconds
        : typeof record._nanoseconds === 'number'
          ? record._nanoseconds
          : 0;
    if (seconds != null) {
      return seconds * 1000 + Math.floor(nanoseconds / 1e6);
    }
  }
  return null;
};

const normalizeCurrency = (value: unknown) => {
  if (typeof value === 'string') {
    const code = toUpperCleanString(value);
    return code ? { code } : null;
  }

  const record = asRecord(value);
  const code = toUpperCleanString(record.code ?? record.currency ?? record.id);
  if (!code) return null;

  const symbol = toCleanString(record.symbol);
  const name = toCleanString(record.name);
  return Object.fromEntries(
    Object.entries({ code, symbol, name }).filter(
      ([, nested]) => nested != null,
    ),
  );
};

const normalizeTotals = (value: unknown) => {
  const record = asRecord(value);
  const normalized = {
    subtotal: safeNumber(record.subtotal),
    discount: safeNumber(record.discount),
    taxes: safeNumber(record.taxes ?? record.tax),
    total: safeNumber(record.total ?? record.amount),
    paid: safeNumber(record.paid ?? record.totalPaid),
    balance: safeNumber(record.balance ?? record.pending),
  };
  const compact = Object.fromEntries(
    Object.entries(normalized).filter(([, nested]) => nested != null),
  );
  return Object.keys(compact).length ? compact : null;
};

const normalizeExchangeRateSnapshot = (value: unknown) => {
  const record = asRecord(value);
  const effectiveRate = safeNumber(
    record.effectiveRate ?? record.rate ?? record.value ?? record.exchangeRate,
  );
  if (effectiveRate == null) return null;
  const sourceName =
    typeof record.source === 'string' ? record.source.toLowerCase() : '';

  const effectiveAt = safeNumber(
    record.effectiveAt ?? record.appliedAt ?? record.capturedAt ?? record.date,
  );
  const referenceRatesRecord = asRecord(record.referenceRates);
  const rateType = normalizeAccountingRateType(
    record.rateType ??
      record.operationType ??
      (sourceName.includes('purchase')
        ? 'buy'
        : sourceName.includes('sale')
          ? 'sell'
          : undefined),
  );
  const normalized = {
    rate: effectiveRate,
    effectiveRate,
    rateId: toCleanString(record.rateId ?? record.id),
    rateType,
    source: toCleanString(record.source),
    provider: toCleanString(record.provider),
    quoteCurrency: toUpperCleanString(
      record.quoteCurrency ?? record.documentCurrency,
    ),
    baseCurrency: toUpperCleanString(
      record.baseCurrency ?? record.functionalCurrency,
    ),
    referenceRates: {
      buyRate: safeNumber(
        referenceRatesRecord.buyRate ??
          record.buyRate ??
          record.purchase ??
          record.purchaseRate ??
          record.buy,
      ),
      sellRate: safeNumber(
        referenceRatesRecord.sellRate ??
          record.sellRate ??
          record.sale ??
          record.saleRate ??
          record.sell,
      ),
    },
    effectiveAt: effectiveAt ?? Date.now(),
  };
  return Object.fromEntries(
    Object.entries(normalized).filter(([, nested]) => nested != null),
  );
};

const normalizeOverride = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === 'boolean') {
    return { applied: value };
  }

  const record = asRecord(value);
  const applied =
    typeof record.applied === 'boolean'
      ? record.applied
      : typeof record.enabled === 'boolean'
        ? record.enabled
        : true;
  const normalized = {
    applied,
    value: safeNumber(record.value ?? record.rate ?? record.exchangeRate),
    reason: toCleanString(record.reason),
    approvedBy: toCleanString(record.approvedBy ?? record.userId),
  };
  return Object.fromEntries(
    Object.entries(normalized).filter(([, nested]) => nested != null),
  );
};

const isAccountingRolloutExplicitlyEnabled = (value: unknown): boolean => {
  const record = asRecord(value);
  const rolloutRecord = asRecord(record.rollout);
  return record.rolloutEnabled === true || rolloutRecord.enabled === true;
};

const isAccountingPilotBusiness = (businessId: unknown): boolean =>
  ACCOUNTING_PILOT_BUSINESS_IDS.has(toCleanString(businessId) ?? '');

export const isAccountingRolloutEnabledForBusiness = (
  businessId: unknown,
  settings?: unknown,
): boolean =>
  isAccountingPilotBusiness(businessId) ||
  isAccountingRolloutExplicitlyEnabled(settings);

const normalizeDocumentCurrencies = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
): SupportedDocumentCurrency[] => {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) => toUpperCleanString(item))
    .filter(
      (item): item is SupportedDocumentCurrency =>
        item != null &&
        (ACCOUNTING_CURRENCY_CODES as readonly string[]).includes(item),
    );

  return Array.from(
    new Set(
      normalized.includes(functionalCurrency)
        ? normalized
        : [functionalCurrency, ...normalized],
    ),
  );
};

const buildManualRatesByCurrency = (
  functionalCurrency: SupportedDocumentCurrency,
  documentCurrencies: SupportedDocumentCurrency[],
  currentRates: AccountingManualRatesByCurrency = {},
): AccountingManualRatesByCurrency =>
  buildAccountingManualRatesByCurrency(
    functionalCurrency,
    documentCurrencies,
    currentRates,
  );

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

const normalizeLegacyManualRates = (
  value: unknown,
  functionalCurrency: SupportedDocumentCurrency,
): AccountingManualRatesByCurrency => {
  const record = asRecord(value);
  const legacyUsdRate = safeNumber(record.USD);
  const normalizedForeignCurrency = normalizeSupportedCurrency(
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

      accumulator[normalizedCurrency] =
        normalizeAccountingCurrencyRateConfig(nestedValue);
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

const normalizeAccountingSettings = (
  value: unknown,
): AccountingSettingsSnapshot | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;

  const functionalCurrency = normalizeSupportedCurrency(
    record.functionalCurrency,
    DEFAULT_FUNCTIONAL_CURRENCY,
  );
  const documentCurrencies = normalizeDocumentCurrencies(
    record.documentCurrencies,
    functionalCurrency,
  );

  return {
    rolloutEnabled: isAccountingRolloutExplicitlyEnabled(record),
    functionalCurrency,
    documentCurrencies,
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
    updatedAt: toTimestampMillis(record.updatedAt),
  };
};

export const getAccountingSettingsForBusiness = async (
  businessId: unknown,
): Promise<AccountingSettingsSnapshot | null> => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    return null;
  }

  const cached = accountingSettingsCache.get(normalizedBusinessId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const settingsRef = doc(
    db,
    'businesses',
    normalizedBusinessId,
    'settings',
    'accounting',
  );
  const snapshot = await getDoc(settingsRef);
  const normalizedSettings = snapshot.exists()
    ? normalizeAccountingSettings(snapshot.data())
    : null;
  const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
    normalizedBusinessId,
    snapshot.exists() ? snapshot.data() : normalizedSettings,
  );
  const value = rolloutEnabled ? normalizedSettings : null;

  accountingSettingsCache.set(normalizedBusinessId, {
    expiresAt: Date.now() + ACCOUNTING_SETTINGS_CACHE_MS,
    value,
  });

  return value;
};

const hasOwnValue = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

const resolveRequestedMonetaryContext = (
  source: unknown,
): RequestedMonetaryContext => {
  const record = asRecord(source);
  const exchangeRateSnapshot = asRecord(record.exchangeRateSnapshot);

  const rawCurrency =
    toUpperCleanString(record.documentCurrency) ??
    toUpperCleanString(record.currency) ??
    toUpperCleanString(record.currencyCode) ??
    toUpperCleanString(record.selectedCurrency) ??
    toUpperCleanString(exchangeRateSnapshot.quoteCurrency);

  const explicitCurrencyProvided =
    rawCurrency != null ||
    hasOwnValue(record, 'documentCurrency') ||
    hasOwnValue(record, 'currency') ||
    hasOwnValue(record, 'currencyCode') ||
    hasOwnValue(record, 'selectedCurrency');

  if (
    explicitCurrencyProvided &&
    rawCurrency != null &&
    !isSupportedDocumentCurrency(rawCurrency)
  ) {
    throw new Error(
      `La moneda ${rawCurrency} no está soportada todavía en el piloto.`,
    );
  }

  return {
    documentCurrency: normalizeSupportedCurrency(
      rawCurrency,
      DEFAULT_FUNCTIONAL_CURRENCY,
    ),
    explicitCurrencyProvided,
  };
};

const sanitizeTotals = (totals: MonetaryTotalsInput) => ({
  subtotal: safeNumber(totals.subtotal),
  discount: safeNumber(totals.discount),
  taxes: safeNumber(totals.taxes),
  total: safeNumber(totals.total),
  paid: safeNumber(totals.paid),
  balance: safeNumber(totals.balance),
});

const convertTotals = (
  totals: ReturnType<typeof sanitizeTotals>,
  rate: number,
) => {
  const convert = (value: number | null) =>
    value == null ? null : roundToTwoDecimals(value * rate);

  return {
    subtotal: convert(totals.subtotal),
    discount: convert(totals.discount),
    taxes: convert(totals.taxes),
    total: convert(totals.total),
    paid: convert(totals.paid),
    balance: convert(totals.balance),
  };
};

export const normalizeMonetarySnapshot = (
  value: unknown,
  options: { capturedBy?: string | null; capturedAt?: number | null } = {},
): Record<string, unknown> | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;

  const documentCurrency = normalizeCurrency(
    record.documentCurrency ?? record.currency ?? record.originalCurrency,
  );
  const functionalCurrency = normalizeCurrency(
    record.functionalCurrency ?? record.baseCurrency,
  ) ?? {
    code: DEFAULT_FUNCTIONAL_CURRENCY,
  };
  const exchangeRateSnapshot = normalizeExchangeRateSnapshot(
    record.exchangeRateSnapshot ?? record.exchangeRate ?? record.rate,
  );
  const documentTotals = normalizeTotals(
    record.documentTotals ?? record.originalTotals ?? record.totals,
  );
  const functionalTotals = normalizeTotals(
    record.functionalTotals ?? record.baseTotals,
  );
  const override = normalizeOverride(record.override ?? record.rateOverride);
  const capturedBy = toCleanString(options.capturedBy ?? record.capturedBy);
  const capturedAt =
    safeNumber(options.capturedAt ?? record.capturedAt ?? record.createdAt) ??
    Date.now();

  const normalized = {
    schemaVersion: 1,
    documentCurrency,
    functionalCurrency,
    exchangeRateSnapshot,
    documentTotals,
    functionalTotals,
    override,
    capturedBy,
    capturedAt,
  };

  const compact = Object.fromEntries(
    Object.entries(normalized).filter(([, nested]) => nested != null),
  );

  if (
    !compact.documentCurrency &&
    !compact.exchangeRateSnapshot &&
    !compact.documentTotals &&
    !compact.functionalTotals
  ) {
    return null;
  }

  return compact;
};

export const buildBaseCurrencyMonetarySnapshot = ({
  documentCurrency,
  functionalCurrency,
  subtotal,
  discount,
  taxes,
  total,
  paid,
  balance,
  capturedBy,
  operationType = 'sale',
}: {
  documentCurrency: SupportedDocumentCurrency;
  functionalCurrency: SupportedDocumentCurrency;
  subtotal?: unknown;
  discount?: unknown;
  taxes?: unknown;
  total?: unknown;
  paid?: unknown;
  balance?: unknown;
  capturedBy?: string | null;
  operationType?: AccountingOperationType;
}): Record<string, unknown> | null => {
  const normalizedTotal = safeNumber(total);
  if (normalizedTotal == null) {
    return null;
  }

  const normalizedPaid = safeNumber(paid) ?? 0;
  const normalizedBalance =
    safeNumber(balance) ??
    roundToTwoDecimals(Math.max(normalizedTotal - normalizedPaid, 0));

  const totals = {
    subtotal: safeNumber(subtotal),
    discount: safeNumber(discount),
    taxes: safeNumber(taxes),
    total: normalizedTotal,
    paid: normalizedPaid,
    balance: normalizedBalance,
  };

  return normalizeMonetarySnapshot(
    {
      documentCurrency: { code: documentCurrency },
      functionalCurrency: { code: functionalCurrency },
      exchangeRateSnapshot: {
        rate: 1,
        rateType: resolveAccountingRateTypeForOperation(operationType),
        source: 'pilot-default',
        provider: 'system',
        quoteCurrency: documentCurrency,
        baseCurrency: functionalCurrency,
        effectiveAt: Date.now(),
      },
      documentTotals: totals,
      functionalTotals: totals,
      override: { applied: false },
    },
    { capturedBy },
  );
};

const buildConfiguredForeignCurrencyMonetarySnapshot = ({
  settings,
  requestedContext,
  totals,
  capturedBy,
  capturedAt,
  operationType,
}: {
  settings: AccountingSettingsSnapshot | null;
  requestedContext: RequestedMonetaryContext;
  totals: MonetaryTotalsInput;
  capturedBy?: string | null;
  capturedAt?: number | null;
  operationType: AccountingOperationType;
}): Record<string, unknown> | null => {
  if (!settings) {
    throw new Error(
      'No se encontró configuración monetaria activa para el negocio piloto.',
    );
  }

  if (
    !settings.documentCurrencies.includes(requestedContext.documentCurrency)
  ) {
    throw new Error(
      `${requestedContext.documentCurrency} no está habilitada en la configuración monetaria del negocio piloto.`,
    );
  }

  const rateType = resolveAccountingRateTypeForOperation(operationType);
  const rateLabel = rateType === 'buy' ? 'compra' : 'venta';
  const referenceRates =
    settings.manualRatesByCurrency[requestedContext.documentCurrency];
  const rate = getAccountingRateValue(referenceRates, rateType);

  if (rate == null || rate <= 0) {
    throw new Error(
      `Debes configurar una tasa manual de ${rateLabel} ${requestedContext.documentCurrency} -> ${settings.functionalCurrency} antes de registrar documentos en ${requestedContext.documentCurrency}.`,
    );
  }

  const normalizedTotals = sanitizeTotals(totals);
  if (normalizedTotals.total == null) {
    return null;
  }

  return normalizeMonetarySnapshot(
    {
      documentCurrency: { code: requestedContext.documentCurrency },
      functionalCurrency: { code: settings.functionalCurrency },
      exchangeRateSnapshot: {
        rate,
        effectiveRate: rate,
        rateId:
          settings.currentExchangeRateIdsByCurrency[
            requestedContext.documentCurrency
          ] ?? null,
        rateType,
        source: `settings-manual-${operationType}`,
        provider: 'settings',
        quoteCurrency: requestedContext.documentCurrency,
        baseCurrency: settings.functionalCurrency,
        referenceRates: {
          buyRate: referenceRates?.buyRate ?? null,
          sellRate: referenceRates?.sellRate ?? null,
        },
        effectiveAt: settings.updatedAt ?? Date.now(),
      },
      documentTotals: normalizedTotals,
      functionalTotals: convertTotals(normalizedTotals, rate),
      override: {
        applied: false,
      },
    },
    {
      capturedBy,
      capturedAt,
    },
  );
};

export const resolveMonetarySnapshotForBusiness = async ({
  businessId,
  monetary,
  source,
  totals,
  capturedBy,
  capturedAt,
  operationType = 'sale',
}: {
  businessId: unknown;
  monetary?: unknown;
  source?: unknown;
  totals: MonetaryTotalsInput;
  capturedBy?: string | null;
  capturedAt?: number | null;
  operationType?: AccountingOperationType;
}): Promise<Record<string, unknown> | null> => {
  const normalized = normalizeMonetarySnapshot(monetary, {
    capturedBy,
    capturedAt,
  });
  if (normalized) {
    return normalized;
  }

  const requestedContext = resolveRequestedMonetaryContext(source);
  const resolvedSettings = await getAccountingSettingsForBusiness(businessId);
  const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
    resolvedSettings,
  );
  if (!rolloutEnabled) {
    return null;
  }
  const effectiveDocumentCurrency = requestedContext.explicitCurrencyProvided
    ? requestedContext.documentCurrency
    : (resolvedSettings?.functionalCurrency ?? DEFAULT_FUNCTIONAL_CURRENCY);
  const effectiveRequestedContext: RequestedMonetaryContext = {
    ...requestedContext,
    documentCurrency: effectiveDocumentCurrency,
  };

  if (!resolvedSettings) {
    if (effectiveDocumentCurrency !== DEFAULT_FUNCTIONAL_CURRENCY) {
      throw new Error(
        `Debes configurar la contabilidad antes de registrar documentos en ${effectiveDocumentCurrency}.`,
      );
    }

    return buildBaseCurrencyMonetarySnapshot({
      documentCurrency: DEFAULT_FUNCTIONAL_CURRENCY,
      functionalCurrency: DEFAULT_FUNCTIONAL_CURRENCY,
      ...totals,
      capturedBy,
      operationType,
    });
  }

  if (
    effectiveRequestedContext.documentCurrency ===
    resolvedSettings.functionalCurrency
  ) {
    return buildBaseCurrencyMonetarySnapshot({
      documentCurrency: effectiveRequestedContext.documentCurrency,
      functionalCurrency: resolvedSettings.functionalCurrency,
      ...totals,
      capturedBy,
      operationType,
    });
  }

  return buildConfiguredForeignCurrencyMonetarySnapshot({
    settings: resolvedSettings,
    requestedContext: effectiveRequestedContext,
    totals,
    capturedBy,
    capturedAt,
    operationType,
  });
};

