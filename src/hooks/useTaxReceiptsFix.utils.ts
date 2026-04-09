export type TaxReceiptRecord = {
  id?: string;
  name?: string;
  type?: string;
  serie?: string;
  sequence?: number | string | null;
  sequenceLength?: number;
  increase?: number;
  quantity?: number | string;
  disabled?: boolean;
};

/** 8 digitos para B, 10 para E */
export const defaultTaxReceiptLength = (serie?: string) =>
  serie === 'B' ? 8 : 10;

export const buildTaxReceiptNormalizationUpdates = (
  docId: string,
  raw: TaxReceiptRecord,
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  if (raw.id !== docId) {
    updates['data.id'] = docId;
  }

  if (typeof raw.disabled !== 'boolean') {
    updates['data.disabled'] = false;
  }

  if (typeof raw.sequenceLength !== 'number') {
    updates['data.sequenceLength'] = defaultTaxReceiptLength(raw.serie);
  }

  const hasNormalizedSequence =
    typeof raw.sequence === 'number' && Number.isFinite(raw.sequence);

  if (!hasNormalizedSequence) {
    const seqNum = Number(raw.sequence);
    const hasConvertibleSequence =
      raw.sequence !== undefined &&
      raw.sequence !== null &&
      raw.sequence !== '' &&
      Number.isFinite(seqNum);

    if (hasConvertibleSequence) {
      updates['data.sequence'] = seqNum;
    }
  }

  return updates;
};
