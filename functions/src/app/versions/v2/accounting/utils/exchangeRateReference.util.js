const DEFAULT_TIME_ZONE = 'America/Santo_Domingo';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundRate = (value) => Math.round(value * 1_000_000) / 1_000_000;

const formatDateParts = (date = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type, fallback) =>
    parts.find((part) => part.type === type)?.value ?? fallback;

  return {
    year: getPart('year', '0000'),
    month: getPart('month', '00'),
    day: getPart('day', '00'),
    hour: getPart('hour', '00'),
    minute: getPart('minute', '00'),
    second: getPart('second', '00'),
  };
};

const getProviderRate = ({ providerBaseCurrency, rates, currency }) => {
  if (currency === providerBaseCurrency) {
    return 1;
  }

  return safeNumber(rates[currency]);
};

export const toExchangeRateHistoryDateKey = (
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
) => {
  const { year, month, day } = formatDateParts(date, timeZone);
  return `${year}-${month}-${day}`;
};

export const buildExchangeRateHistoryEntryId = (
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
) => {
  const { year, month, day, hour, minute, second } = formatDateParts(
    date,
    timeZone,
  );
  return `${year}-${month}-${day}T${hour}-${minute}-${second}`;
};

export const buildRatesByCurrency = ({ settings, providerPayload }) => {
  const enabledForeignCurrencies = (settings.documentCurrencies || []).filter(
    (currency) => currency !== settings.functionalCurrency,
  );
  const rates = asRecord(providerPayload.rates);
  const providerBaseCurrency = providerPayload.providerBaseCurrency;
  const functionalRate = getProviderRate({
    providerBaseCurrency,
    rates,
    currency: settings.functionalCurrency,
  });

  if (functionalRate == null || functionalRate <= 0) {
    return {};
  }

  return enabledForeignCurrencies.reduce((accumulator, currency) => {
    const quoteRate = getProviderRate({
      providerBaseCurrency,
      rates,
      currency,
    });

    if (quoteRate == null || quoteRate <= 0) {
      return accumulator;
    }

    accumulator[currency] = {
      quoteCurrency: currency,
      baseCurrency: settings.functionalCurrency,
      providerRate: roundRate(quoteRate / functionalRate),
      referenceRate: roundRate(functionalRate / quoteRate),
    };
    return accumulator;
  }, {});
};
