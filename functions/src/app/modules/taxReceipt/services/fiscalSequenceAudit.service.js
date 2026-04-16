import { db, FieldValue } from '../../../core/config/firebase.js';

const extractSequenceMetadata = (ncfCode) => {
  if (typeof ncfCode !== 'string') {
    return {
      prefix: null,
      sequence: null,
      sequenceNumber: null,
      sequenceLength: 0,
    };
  }

  const trimmedCode = ncfCode.trim();
  const match = trimmedCode.match(/(\d+)$/);
  const rawDigits = match?.[1] ?? null;
  const defaultSequenceLength = 10;
  const shouldUseDefaultLength =
    rawDigits &&
    rawDigits.length > defaultSequenceLength &&
    /[A-Z]/i.test(
      trimmedCode.slice(
        0,
        Math.max(trimmedCode.length - defaultSequenceLength, 0),
      ),
    );
  const sequence = rawDigits
    ? shouldUseDefaultLength
      ? trimmedCode.slice(-defaultSequenceLength)
      : rawDigits
    : null;
  const prefix = sequence
    ? trimmedCode.slice(0, Math.max(trimmedCode.length - sequence.length, 0))
    : null;
  const sequenceNumber = sequence ? Number(sequence) : null;

  return {
    prefix,
    sequence,
    sequenceNumber: Number.isFinite(sequenceNumber) ? sequenceNumber : null,
    sequenceLength: sequence?.length ?? 0,
  };
};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const writeFiscalSequenceAudit = (
  tx,
  {
    businessId,
    userId,
    usageId,
    ncfCode,
    taxReceiptName,
    engine,
    sourceType,
    sourceFunction,
    taxReceiptId = null,
  },
) => {
  const cleanBusinessId = toCleanString(businessId);
  const cleanUsageId = toCleanString(usageId);
  const cleanUserId = toCleanString(userId);
  const cleanNcfCode = toCleanString(ncfCode);

  if (!tx?.set) {
    throw new Error('Transacción inválida para registrar auditoría fiscal');
  }
  if (!cleanBusinessId || !cleanUsageId || !cleanUserId || !cleanNcfCode) {
    throw new Error('Faltan datos para registrar auditoría fiscal');
  }

  const sequenceMeta = extractSequenceMetadata(cleanNcfCode);
  const auditRef = db.doc(
    `businesses/${cleanBusinessId}/fiscalSequenceAudit/${cleanUsageId}`,
  );

  tx.set(auditRef, {
    id: cleanUsageId,
    businessId: cleanBusinessId,
    usageId: cleanUsageId,
    userId: cleanUserId,
    eventType: 'credit_note_ncf_reserved',
    sourceType: toCleanString(sourceType) ?? 'creditNote',
    sourceFunction: toCleanString(sourceFunction) ?? 'reserveCreditNoteNcf',
    taxReceiptName: toCleanString(taxReceiptName),
    taxReceiptId: toCleanString(taxReceiptId),
    ncfCode: cleanNcfCode,
    ncfPrefix: sequenceMeta.prefix,
    ncfSequence: sequenceMeta.sequence,
    ncfSequenceNumber: sequenceMeta.sequenceNumber,
    ncfSequenceLength: sequenceMeta.sequenceLength,
    engine: toCleanString(engine) ?? 'backend.reserveNcf',
    status: 'reserved',
    createdAt: FieldValue.serverTimestamp(),
  });

  return auditRef.id;
};
