/**
 * Genera el contenido TXT del Formato 607 DGII.
 * Norma General 07-2018 y 05-2019.
 * Formato: pipe-delimited, CRLF line endings.
 */

import {
  DGII_607_CONSUMER_FINAL_MINIMUM,
  assertValidDgii607Header,
  assertValidDgii607Draft,
  buildDgii607Draft,
  isConsumerFinalNcf,
  isExcludedStatus,
  resolveIdentType,
  serializeDgii607Draft,
} from './dgii607ValidationEngine.service.js';

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveRecordNcf = (record) =>
  toCleanString(record?.data?.NCF) ?? toCleanString(record?.ncf) ?? '';

export {
  DGII_607_CONSUMER_FINAL_MINIMUM,
  assertValidDgii607Header,
  isConsumerFinalNcf,
  isExcludedStatus,
  resolveIdentType,
};

export const shouldExcludeDgii607TxtRecord = ({
  record,
  isCredit = false,
}) => {
  if (isExcludedStatus(record?.status)) {
    return true;
  }

  const ncf = resolveRecordNcf(record);
  if (!ncf) {
    return true;
  }

  if (isCredit) {
    return false;
  }

  const total = Number(record?.totals?.total);
  return (
    isConsumerFinalNcf(ncf) &&
    Number.isFinite(total) &&
    total < DGII_607_CONSUMER_FINAL_MINIMUM
  );
};

export const buildDgii607TxtRow = ({
  record,
  firestoreDoc,
  isCredit = false,
  originalNcf = null,
}) => {
  const draft = buildDgii607Draft({
    record,
    firestoreDoc,
    isCredit,
    originalNcf,
  });

  assertValidDgii607Draft(draft);
  return serializeDgii607Draft(draft);
};

export const buildDgii607TxtContent = ({ businessRnc, periodKey, rows }) => {
  const period = periodKey.replace('-', '');
  const header = `607|${businessRnc}|${period}|${String(rows.length).padStart(12, '0')}`;
  return [header, ...rows].join('\r\n');
};

export const buildDgii607TxtFileName = ({ businessRnc, periodKey }) => {
  const period = periodKey.replace('-', '');
  return `607_${businessRnc}_${period}.txt`;
};
