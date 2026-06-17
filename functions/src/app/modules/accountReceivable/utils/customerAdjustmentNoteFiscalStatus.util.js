const ACCEPTED_ELECTRONIC_ADJUSTMENT_NOTE_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'shadow_ready',
]);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const normalizeAdjustmentNoteFiscalStatus = (value) =>
  String(value || '').trim().toLowerCase() || null;

export const isElectronicAdjustmentNote = (record, { ncfPrefix = null } = {}) => {
  const data = asRecord(record);
  const electronicTaxReceipt = asRecord(data.electronicTaxReceipt);
  const ncf = String(data.eNcf || data.ncf || '').trim().toUpperCase();
  const expectedPrefix = String(ncfPrefix || '').trim().toUpperCase();

  return (
    normalizeAdjustmentNoteFiscalStatus(data.documentFormat) === 'electronic' ||
    normalizeAdjustmentNoteFiscalStatus(data.fiscalMode) === 'electronic_ecf' ||
    (expectedPrefix ? ncf.startsWith(expectedPrefix) : /^E3[34]/.test(ncf)) ||
    Object.keys(electronicTaxReceipt).length > 0
  );
};

export const resolveElectronicAdjustmentNoteFiscalStatus = (record) => {
  const electronicTaxReceipt = asRecord(asRecord(record).electronicTaxReceipt);

  return (
    normalizeAdjustmentNoteFiscalStatus(electronicTaxReceipt.dgiiValidationStatus) ||
    normalizeAdjustmentNoteFiscalStatus(electronicTaxReceipt.dgiiStatus) ||
    normalizeAdjustmentNoteFiscalStatus(electronicTaxReceipt.validationStatus) ||
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
