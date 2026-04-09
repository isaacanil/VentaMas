import { db } from '../../../../core/config/firebase.js';
import { resolveJournalPeriodKey } from './journalEntry.util.js';

const PERIOD_LABEL_FORMATTER = new Intl.DateTimeFormat('es-DO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null;
  }
  if (typeof value?.toMillis === 'function') {
    const millis = value.toMillis();
    return Number.isFinite(millis) ? new Date(millis) : null;
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
          : 0;

    if (seconds != null) {
      const nextDate = new Date(seconds * 1000 + Math.floor(nanoseconds / 1e6));
      return Number.isNaN(nextDate.getTime()) ? null : nextDate;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const nextDate = new Date(value);
    return Number.isNaN(nextDate.getTime()) ? null : nextDate;
  }
  return null;
};

export const buildAccountingPeriodKey = (
  value,
  fallbackDate = new Date(),
) => resolveJournalPeriodKey(toDateOrNull(value) ?? fallbackDate);

const coalesceDate = (...values) => {
  for (const value of values) {
    const nextDate = toDateOrNull(value);
    if (nextDate) {
      return nextDate;
    }
  }

  return null;
};

export const resolveInvoiceEffectiveDate = (
  payload,
  fallbackDate = new Date(),
) =>
  coalesceDate(
    payload?.cart?.date,
    payload?.cart?.createdAt,
    fallbackDate,
  );

export const resolveInvoiceAccountingPeriodKey = (
  payload,
  fallbackDate = new Date(),
) => buildAccountingPeriodKey(resolveInvoiceEffectiveDate(payload, fallbackDate));

export const isAccountingPeriodValidationEnabled = ({
  rolloutEnabled,
  settings,
}) => rolloutEnabled && asRecord(settings).generalAccountingEnabled === true;

export const getAccountingPeriodClosureRef = ({
  businessId,
  periodKey,
}) => db.doc(`businesses/${businessId}/accountingPeriodClosures/${periodKey}`);

export const readAccountingPeriodClosureInTransaction = ({
  transaction,
  businessId,
  periodKey,
}) =>
  transaction.get(
    getAccountingPeriodClosureRef({
      businessId,
      periodKey,
    }),
  );

export const formatAccountingPeriodLabel = (periodKey) => {
  const normalizedPeriodKey = toCleanString(periodKey);
  if (!normalizedPeriodKey) return null;

  const [year, month] = normalizedPeriodKey.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  const labelDate = new Date(Date.UTC(year, month - 1, 1));
  return PERIOD_LABEL_FORMATTER.format(labelDate);
};

export const buildClosedPeriodInvoiceMessage = (periodKey) => {
  const periodLabel = formatAccountingPeriodLabel(periodKey);

  if (!periodLabel) {
    return (
      'No puedes registrar esta factura con la fecha seleccionada porque ese periodo contable esta cerrado. ' +
      'Usa otra fecha o solicita reabrir el periodo.'
    );
  }

  return (
    `No puedes registrar esta factura con fecha de ${periodLabel} porque ese periodo contable ` +
    'esta cerrado. Usa otra fecha o solicita reabrir el periodo.'
  );
};

export const buildClosedAccountingPeriodMessage = ({
  periodKey,
  operationLabel,
}) => {
  const periodLabel = formatAccountingPeriodLabel(periodKey);
  const normalizedOperationLabel =
    toCleanString(operationLabel) ?? 'registrar esta operacion';

  if (!periodLabel) {
    return (
      `No puedes ${normalizedOperationLabel} con la fecha seleccionada porque ese periodo contable esta cerrado. ` +
      'Usa otra fecha o solicita reabrir el periodo.'
    );
  }

  return (
    `No puedes ${normalizedOperationLabel} con fecha de ${periodLabel} porque ese periodo contable ` +
    'esta cerrado. Usa otra fecha o solicita reabrir el periodo.'
  );
};

export const assertAccountingPeriodOpenInTransaction = async ({
  transaction,
  businessId,
  effectiveDate,
  settings,
  rolloutEnabled,
  operationLabel,
  buildMessage = null,
  createError = null,
}) => {
  if (
    !isAccountingPeriodValidationEnabled({
      rolloutEnabled,
      settings,
    })
  ) {
    return null;
  }

  const periodKey = buildAccountingPeriodKey(effectiveDate);
  const closureSnap = await readAccountingPeriodClosureInTransaction({
    transaction,
    businessId,
    periodKey,
  });

  if (closureSnap.exists) {
    let message;
    if (typeof buildMessage === 'function') {
      message = buildMessage(periodKey);
    } else {
      message = buildClosedAccountingPeriodMessage({
        periodKey,
        operationLabel,
      });
    }

    if (typeof createError === 'function') {
      throw createError(message);
    }

    throw new Error(message);
  }

  return periodKey;
};
