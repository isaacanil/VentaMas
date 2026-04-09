/* global fetch, process, URL */
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { Timestamp, db } from '../../../core/config/firebase.js';
import {
  ACCOUNTING_EXCHANGE_RATE_REFERENCE_CRON,
  ACCOUNTING_EXCHANGE_RATE_REFERENCE_SECRETS,
  ACCOUNTING_EXCHANGE_RATE_REFERENCE_TZ,
  OPEN_EXCHANGE_RATES_APP_ID,
} from '../../../core/config/secrets.js';
import {
  buildExchangeRateHistoryEntryId,
  toExchangeRateHistoryDateKey,
} from './utils/exchangeRateReference.util.js';

const EXCHANGE_RATE_PROVIDER = 'open-exchange-rates';
const EXCHANGE_RATE_API_URL = 'https://openexchangerates.org/api/latest.json';
const EXCHANGE_RATE_PROVIDER_DOC_PATH =
  'system/marketData/exchangeRateProviders/open-exchange-rates';
const DEFAULT_TIME_ZONE = 'America/Santo_Domingo';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getParamValue = (paramDef, envName, fallback = null) => {
  try {
    if (paramDef && typeof paramDef.value === 'function') {
      const value = paramDef.value();
      if (value != null && String(value).trim().length) {
        return String(value).trim();
      }
    }
  } catch {
    // ignore missing runtime param in local/test contexts
  }

  const envValue = process.env[envName];
  if (envValue != null && String(envValue).trim().length) {
    return String(envValue).trim();
  }

  return fallback;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveOpenExchangeRatesAppId = () => {
  const appId = getParamValue(
    OPEN_EXCHANGE_RATES_APP_ID,
    'OPEN_EXCHANGE_RATES_APP_ID',
  );

  if (!appId) {
    throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured.');
  }

  return appId;
};

const fetchLatestRates = async () => {
  const appId = resolveOpenExchangeRatesAppId();
  const url = new URL(EXCHANGE_RATE_API_URL);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('prettyprint', 'false');

  const response = await fetch(url);

  let payload = {};
  try {
    payload = asRecord(await response.json());
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const providerMessage =
      toCleanString(payload.description) ??
      toCleanString(payload.message) ??
      'Unknown provider error.';
    throw new Error(
      `Exchange rate provider returned ${response.status}: ${providerMessage}`,
    );
  }

  if (payload.error === true) {
    throw new Error(
      toCleanString(payload.description) ??
        toCleanString(payload.message) ??
        'Open Exchange Rates returned an error payload.',
    );
  }

  const rates = asRecord(payload.rates);
  const providerBaseCurrency = toCleanString(
    payload.base ?? payload.base_code ?? payload.baseCode,
  ) ?? 'USD';
  const marketTimestampSeconds = safeNumber(payload.timestamp);

  return {
    provider: EXCHANGE_RATE_PROVIDER,
    providerBaseCurrency,
    fetchedAt: Timestamp.now(),
    marketUpdatedAt:
      marketTimestampSeconds != null
        ? Timestamp.fromMillis(marketTimestampSeconds * 1000)
        : Timestamp.now(),
    nextUpdateAt: null,
    rates,
  };
};

const persistGlobalExchangeRateReference = async ({ providerPayload }) => {
  const latestRef = db.doc(EXCHANGE_RATE_PROVIDER_DOC_PATH);
  const fetchedAtDate = providerPayload.fetchedAt.toDate();
  const historyDate = toExchangeRateHistoryDateKey(
    fetchedAtDate,
    DEFAULT_TIME_ZONE,
  );
  const historyEntryId = buildExchangeRateHistoryEntryId(
    fetchedAtDate,
    DEFAULT_TIME_ZONE,
  );
  const historyRef = latestRef.collection('history').doc(historyEntryId);
  const rateCount = Object.keys(providerPayload.rates).length;

  const payload = {
    schemaVersion: 1,
    provider: providerPayload.provider,
    sourceType: 'scheduled',
    fetchedAt: providerPayload.fetchedAt,
    marketUpdatedAt: providerPayload.marketUpdatedAt,
    nextUpdateAt: providerPayload.nextUpdateAt,
    historyDate,
    providerBaseCurrency: providerPayload.providerBaseCurrency,
    rateCount,
    rates: providerPayload.rates,
  };

  const batch = db.batch();
  batch.set(latestRef, payload, { merge: true });
  batch.set(historyRef, payload, { merge: true });
  await batch.commit();

  return {
    stored: true,
    rateCount,
    historyDate,
    historyEntryId,
  };
};

export const syncAccountingExchangeRateReferencesDaily = onSchedule(
  {
    secrets: ACCOUNTING_EXCHANGE_RATE_REFERENCE_SECRETS,
    schedule: ACCOUNTING_EXCHANGE_RATE_REFERENCE_CRON,
    timeZone: ACCOUNTING_EXCHANGE_RATE_REFERENCE_TZ,
    retryCount: 0,
  },
  async () => {
    let providerPayload = null;

    try {
      providerPayload = await fetchLatestRates();
    } catch (error) {
      logger.error('syncAccountingExchangeRateReferencesDaily provider failed', {
        error: error instanceof Error ? error.message : error,
        provider: EXCHANGE_RATE_PROVIDER,
      });
      throw error;
    }
    const result = await persistGlobalExchangeRateReference({
      providerPayload,
    });

    logger.info('syncAccountingExchangeRateReferencesDaily completed', {
      provider: EXCHANGE_RATE_PROVIDER,
      globalStored: result.stored,
      globalRateCount: result.rateCount,
      globalHistoryDate: result.historyDate,
      globalHistoryEntryId: result.historyEntryId,
      latestDocPath: EXCHANGE_RATE_PROVIDER_DOC_PATH,
    });
  },
);
