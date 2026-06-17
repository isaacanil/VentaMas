const ACCEPTED_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'shadow_ready',
]);
const TERMINAL_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'rejected',
]);
const NON_FINAL_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES = new Set([
  'not_checked',
  'pending',
  'queued',
]);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const normalizeAdjustmentNoteFiscalStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase() || null;

export const isElectronicAdjustmentNote = (
  record,
  { ncfPrefix = null } = {},
) => {
  const data = asRecord(record);
  const electronicTaxReceipt = asRecord(data.electronicTaxReceipt);
  const ncf = String(data.eNcf || data.ncf || '')
    .trim()
    .toUpperCase();
  const expectedPrefix = String(ncfPrefix || '')
    .trim()
    .toUpperCase();

  return (
    normalizeAdjustmentNoteFiscalStatus(data.documentFormat) === 'electronic' ||
    normalizeAdjustmentNoteFiscalStatus(data.fiscalMode) === 'electronic_ecf' ||
    (expectedPrefix ? ncf.startsWith(expectedPrefix) : /^E3[34]/.test(ncf)) ||
    Object.keys(electronicTaxReceipt).length > 0
  );
};

export const resolveElectronicAdjustmentNoteFiscalStatus = (record) => {
  const electronicTaxReceipt = asRecord(asRecord(record).electronicTaxReceipt);
  const terminalCandidates = [
    electronicTaxReceipt.dgiiValidationStatus,
    electronicTaxReceipt.dgiiStatus,
    electronicTaxReceipt.validationStatus,
    electronicTaxReceipt.rfceStatus,
    electronicTaxReceipt.rfceSubmissionStatus,
    electronicTaxReceipt.status,
    electronicTaxReceipt.requestStatus,
    electronicTaxReceipt.dgiiSubmissionStatus,
  ].map(normalizeAdjustmentNoteFiscalStatus);

  const terminalStatus = terminalCandidates.find((status) =>
    TERMINAL_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES.has(status),
  );
  if (terminalStatus) return terminalStatus;

  const lifecycleStatus = normalizeAdjustmentNoteFiscalStatus(
    electronicTaxReceipt.status,
  );
  if (
    lifecycleStatus &&
    !NON_FINAL_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES.has(lifecycleStatus)
  ) {
    return lifecycleStatus;
  }

  const requestStatus = normalizeAdjustmentNoteFiscalStatus(
    electronicTaxReceipt.requestStatus ||
      electronicTaxReceipt.dgiiSubmissionStatus,
  );
  if (
    requestStatus &&
    !NON_FINAL_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES.has(requestStatus)
  ) {
    return requestStatus;
  }

  return (
    normalizeAdjustmentNoteFiscalStatus(
      electronicTaxReceipt.dgiiValidationStatus,
    ) ||
    normalizeAdjustmentNoteFiscalStatus(electronicTaxReceipt.dgiiStatus) ||
    normalizeAdjustmentNoteFiscalStatus(
      electronicTaxReceipt.validationStatus,
    ) ||
    normalizeAdjustmentNoteFiscalStatus(electronicTaxReceipt.rfceStatus) ||
    normalizeAdjustmentNoteFiscalStatus(electronicTaxReceipt.status)
  );
};

export const canCreateFinancialEffectsForAdjustmentNote = (
  record,
  { ncfPrefix = null } = {},
) => {
  if (!isElectronicAdjustmentNote(record, { ncfPrefix })) {
    return true;
  }

  return ACCEPTED_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES.has(
    resolveElectronicAdjustmentNoteFiscalStatus(record),
  );
};
