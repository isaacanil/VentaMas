import type { TaxReceiptData, TaxReceiptDocument } from '@/types/taxReceipt';
import type { TimestampLike } from '@/utils/date/types';
import { toMillis } from '@/utils/date/toMillis';

const DEFAULT_SEQUENCE = '0000000000';

type ReceiptWithMeta = TaxReceiptData & {
  id: string;
  document: TaxReceiptDocument;
  createdAt?: TimestampLike;
  originalIndex: number;
};

const resolveReceiptSerie = (data: TaxReceiptData): string =>
  data.serie || data.series || 'unknown';

const hasConsumedSequence = (sequence: TaxReceiptData['sequence']): boolean => {
  if (sequence === null || sequence === undefined || sequence === '') {
    return false;
  }

  const sequenceText = String(sequence).trim();
  if (!sequenceText || sequenceText === DEFAULT_SEQUENCE) {
    return false;
  }

  const numericSequence = Number(sequenceText);
  if (Number.isFinite(numericSequence)) {
    return numericSequence > 0;
  }

  return true;
};

const getCreatedAtMillis = (value: TimestampLike | undefined): number | null =>
  toMillis(value) ?? null;

const shouldPreferReceipt = (
  current: ReceiptWithMeta,
  candidate: ReceiptWithMeta,
): boolean => {
  const currentConsumed = hasConsumedSequence(current.sequence);
  const candidateConsumed = hasConsumedSequence(candidate.sequence);

  if (currentConsumed !== candidateConsumed) {
    return candidateConsumed;
  }

  const currentCreatedAt = getCreatedAtMillis(current.createdAt);
  const candidateCreatedAt = getCreatedAtMillis(candidate.createdAt);

  if (currentCreatedAt === null && candidateCreatedAt !== null) {
    return true;
  }

  if (currentCreatedAt !== null && candidateCreatedAt !== null) {
    return candidateCreatedAt < currentCreatedAt;
  }

  return candidate.originalIndex < current.originalIndex;
};

export const dedupeTaxReceiptDocuments = (
  receipts: TaxReceiptDocument[],
): TaxReceiptDocument[] => {
  const selectedBySerie = new Map<string, ReceiptWithMeta>();

  receipts.forEach((receipt, originalIndex) => {
    const data = receipt.data;
    const serie = resolveReceiptSerie(data);
    const candidate: ReceiptWithMeta = {
      ...data,
      id: receipt.id ?? data.id ?? serie,
      document: receipt,
      createdAt: data.createdAt as TimestampLike | undefined,
      originalIndex,
    };
    const current = selectedBySerie.get(serie);

    if (!current || shouldPreferReceipt(current, candidate)) {
      selectedBySerie.set(serie, candidate);
    }
  });

  return Array.from(selectedBySerie.values())
    .sort((left, right) => left.originalIndex - right.originalIndex)
    .map((receipt) => receipt.document);
};
