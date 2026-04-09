import { Timestamp, db } from '../../../../core/config/firebase.js';
import {
  buildManualRatesByCurrency as buildAccountingManualRatesByCurrency,
  getAccountingRateValue,
  normalizeAccountingRateConfig,
  normalizeAccountingRateType,
  resolveAccountingRateTypeForOperation,
} from './accountingContract.util.js';

export const ACCOUNTING_PILOT_BUSINESS_IDS = new Set(['X63aIFwHzk3r0gmT8w6P']);
const ACCOUNTING_SETTINGS_CACHE_MS = 30 * 1000;
const ACCOUNTING_CURRENCY_CODES = ['DOP', 'USD', 'EUR'];
const DEFAULT_FUNCTIONAL_CURRENCY = 'DOP';
const accountingSettingsCache = new Map();

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toUpperCleanString = (value) => {
  const normalized = toCleanString(value);
  return normalized ? normalized.toUpperCase() : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isSupportedCurrency = (value) =>
  typeof value === 'string' &&
  ACCOUNTING_CURRENCY_CODES.includes(value.toUpperCase());

const normalizeSupportedCurrency = (
  value,
  fallback = DEFAULT_FUNCTIONAL_CURRENCY,
) => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toUpperCase();
  return isSupportedCurrency(normalized) ? normalized : fallback;
};

const roundToTwoDecimals = (value) => Math.round(value * 100) / 100;

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (typeof value?.toMillis === 'function') {
    return Timestamp.fromMillis(value.toMillis());
  }
  if (value instanceof Date) {
    return Timestamp.fromMillis(value.getTime());
  }
  if (typeof value?.toDate === 'function') {
    const dateValue = value.toDate();
    if (dateValue instanceof Date) {
      return Timestamp.fromMillis(dateValue.getTime());
    }
  }
  if (typeof value === 'number') {
    return Timestamp.fromMillis(value);
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : Timestamp.fromMillis(parsed);
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    const nanoseconds =
      typeof value.nanoseconds === 'number'
        ? value.nanoseconds
        : typeof value._nanoseconds === 'number'
          ? value._nanoseconds
          : null;
    if (seconds != null && nanoseconds != null) {
      return new Timestamp(seconds, nanoseconds);
    }
  }
  return null;
};

const normalizeCurrency = (value) => {
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

const normalizeTotals = (value) => {
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

const normalizeExchangeRateSnapshot = (value) => {
  const record = asRecord(value);
  const effectiveRate = safeNumber(
    record.effectiveRate ?? record.rate ?? record.value ?? record.exchangeRate,
  );
  if (effectiveRate == null) return null;
  const sourceName =
    typeof record.source === 'string' ? record.source.toLowerCase() : '';
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
    effectiveAt:
      normalizeTimestamp(
        record.effectiveAt ??
          record.appliedAt ??
          record.capturedAt ??
          record.date,
      ) || Timestamp.now(),
  };
  return Object.fromEntries(
    Object.entries(normalized).filter(([, nested]) => nested != null),
  );
};

const normalizeOverride = (value) => {
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

const isAccountingRolloutExplicitlyEnabled = (value) => {
  const record = asRecord(value);
  const rolloutRecord = asRecord(record.rollout);
  return record.rolloutEnabled === true || rolloutRecord.enabled === true;
};

const isAccountingPilotBusiness = (businessId) =>
  ACCOUNTING_PILOT_BUSINESS_IDS.has(toCleanString(businessId) || '');

export const isAccountingRolloutEnabledForBusiness = (
  businessId,
  settings = null,
) =>
  isAccountingPilotBusiness(businessId) ||
  isAccountingRolloutExplicitlyEnabled(settings);

const normalizeDocumentCurrencies = (
  value,
  functionalCurrency = DEFAULT_FUNCTIONAL_CURRENCY,
) => {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) => toUpperCleanString(item))
    .filter((item) => item != null && ACCOUNTING_CURRENCY_CODES.includes(item));

  return Array.from(
    new Set(
      normalized.includes(functionalCurrency)
        ? normalized
        : [functionalCurrency, ...normalized],
    ),
  );
};

const buildManualRatesByCurrency = (
  functionalCurrency,
  documentCurrencies,
  currentRates = {},
) =>
  buildAccountingManualRatesByCurrency(
    functionalCurrency,
    documentCurrencies,
    currentRates,
  );

const buildCurrentExchangeRateIdsByCurrency = (
  functionalCurrency,
  documentCurrencies,
  currentRateIds = {},
) =>
  Array.from(new Set([functionalCurrency, ...documentCurrencies]))
    .filter((currency) => currency !== functionalCurrency)
    .reduce((accumulator, currency) => {
      accumulator[currency] = toCleanString(currentRateIds[currency]) || null;
      return accumulator;
    }, {});

const normalizeLegacyManualRates = (value, functionalCurrency) => {
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
  value,
  functionalCurrency,
  documentCurrencies,
) => {
  const record = asRecord(value);
  const nestedRates = Object.entries(record).reduce(
    (accumulator, [currencyKey, nestedValue]) => {
      if (!ACCOUNTING_CURRENCY_CODES.includes(currencyKey)) {
        return accumulator;
      }

      if (currencyKey === functionalCurrency) {
        return accumulator;
      }

      accumulator[currencyKey] = normalizeAccountingRateConfig(nestedValue);
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
  value,
  functionalCurrency,
  documentCurrencies,
) => {
  const record = asRecord(value);
  const source = Object.entries(record).reduce(
    (accumulator, [currencyKey, nestedValue]) => {
      if (!ACCOUNTING_CURRENCY_CODES.includes(currencyKey)) {
        return accumulator;
      }

      if (currencyKey === functionalCurrency) {
        return accumulator;
      }

      accumulator[currencyKey] = toCleanString(nestedValue) || null;
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

const normalizeAccountingSettings = (value) => {
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
    generalAccountingEnabled: record.generalAccountingEnabled === true,
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
    updatedAt: normalizeTimestamp(record.updatedAt),
  };
};

export const getPilotAccountingSettingsForBusiness = async (
  businessId,
  options = {},
) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    return null;
  }

  if (options.settings) {
    const normalizedSettings = normalizeAccountingSettings(options.settings);
    return isAccountingRolloutEnabledForBusiness(
      normalizedBusinessId,
      options.settings,
    )
      ? normalizedSettings
      : null;
  }

  const cached = accountingSettingsCache.get(normalizedBusinessId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const snapshot = await db
    .doc(`businesses/${normalizedBusinessId}/settings/accounting`)
    .get();
  const rawSettings = snapshot.exists ? snapshot.data() : null;
  const normalizedSettings = rawSettings
    ? normalizeAccountingSettings(rawSettings)
    : null;
  const value = isAccountingRolloutEnabledForBusiness(
    normalizedBusinessId,
    rawSettings ?? normalizedSettings,
  )
    ? normalizedSettings
    : null;

  accountingSettingsCache.set(normalizedBusinessId, {
    expiresAt: Date.now() + ACCOUNTING_SETTINGS_CACHE_MS,
    value,
  });

  return value;
};

const hasOwnValue = (record, key) =>
  Object.prototype.hasOwnProperty.call(record, key);

const resolveRequestedMonetaryContext = (source) => {
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
    !isSupportedCurrency(rawCurrency)
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

const sanitizeTotals = (totals) => ({
  subtotal: safeNumber(totals?.subtotal),
  discount: safeNumber(totals?.discount),
  taxes: safeNumber(totals?.taxes),
  total: safeNumber(totals?.total),
  paid: safeNumber(totals?.paid),
  balance: safeNumber(totals?.balance),
});

const convertTotals = (totals, rate) => {
  const convert = (value) =>
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

export const normalizePilotMonetarySnapshot = (value, options = {}) => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;

  const documentCurrency = normalizeCurrency(
    record.documentCurrency ?? record.currency ?? record.originalCurrency,
  );
  const functionalCurrency = normalizeCurrency(
    record.functionalCurrency ?? record.baseCurrency,
  ) || {
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
    normalizeTimestamp(
      options.capturedAt ?? record.capturedAt ?? record.createdAt,
    ) || Timestamp.now();

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

export const buildPilotBaseCurrencyMonetarySnapshot = ({
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
}) => {
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

  return normalizePilotMonetarySnapshot(
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
        effectiveAt: Timestamp.now(),
      },
      documentTotals: totals,
      functionalTotals: totals,
      override: { applied: false },
    },
    { capturedBy },
  );
};

const buildConfiguredForeignSnapshot = ({
  settings,
  requestedContext,
  totals,
  capturedBy,
  capturedAt,
  operationType,
}) => {
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

  return normalizePilotMonetarySnapshot(
    {
      documentCurrency: { code: requestedContext.documentCurrency },
      functionalCurrency: { code: settings.functionalCurrency },
      exchangeRateSnapshot: {
        rate,
        effectiveRate: rate,
        rateId:
          settings.currentExchangeRateIdsByCurrency[
            requestedContext.documentCurrency
          ] || null,
        rateType,
        source: `settings-manual-${operationType}`,
        provider: 'settings',
        quoteCurrency: requestedContext.documentCurrency,
        baseCurrency: settings.functionalCurrency,
        referenceRates: {
          buyRate: referenceRates?.buyRate ?? null,
          sellRate: referenceRates?.sellRate ?? null,
        },
        effectiveAt: settings.updatedAt || Timestamp.now(),
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

export const resolvePilotMonetarySnapshotForBusiness = async ({
  businessId,
  monetary,
  source,
  totals,
  capturedBy,
  capturedAt,
  operationType = 'sale',
  settings,
}) => {
  const normalized = normalizePilotMonetarySnapshot(monetary, {
    capturedBy,
    capturedAt,
  });
  if (normalized) {
    return normalized;
  }

  const requestedContext = resolveRequestedMonetaryContext(source);
  const resolvedSettings = await getPilotAccountingSettingsForBusiness(
    businessId,
    { settings },
  );
  const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
    settings ?? resolvedSettings,
  );
  if (!rolloutEnabled) {
    return null;
  }
  const effectiveDocumentCurrency = requestedContext.explicitCurrencyProvided
    ? requestedContext.documentCurrency
    : (resolvedSettings?.functionalCurrency ?? DEFAULT_FUNCTIONAL_CURRENCY);
  const effectiveRequestedContext = {
    ...requestedContext,
    documentCurrency: effectiveDocumentCurrency,
  };

  if (!resolvedSettings) {
    if (effectiveDocumentCurrency !== DEFAULT_FUNCTIONAL_CURRENCY) {
      throw new Error(
        `Debes configurar la contabilidad antes de registrar documentos en ${effectiveDocumentCurrency}.`,
      );
    }

    return buildPilotBaseCurrencyMonetarySnapshot({
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
    return buildPilotBaseCurrencyMonetarySnapshot({
      documentCurrency: effectiveRequestedContext.documentCurrency,
      functionalCurrency: resolvedSettings.functionalCurrency,
      ...totals,
      capturedBy,
      operationType,
    });
  }

  return buildConfiguredForeignSnapshot({
    settings: resolvedSettings,
    requestedContext: effectiveRequestedContext,
    totals,
    capturedBy,
    capturedAt,
    operationType,
  });
};
