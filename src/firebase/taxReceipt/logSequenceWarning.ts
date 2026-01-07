import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import type {
  TaxReceiptFormValues,
  TaxReceiptSequenceValidation,
} from '@/types/taxReceipt';
import { db } from '@/firebase/firebaseconfig';

const toPlainObject = (value) => {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch (error) {
    console.error(
      'No se pudo serializar el objeto para auditoría de NCF:',
      error,
    );
    return null;
  }
};

const buildWarningCode = () => {
  const timeSegment = Date.now().toString(36).toUpperCase();
  const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NCF-WARN-${timeSegment}-${randomSegment}`;
};

export const logSequenceWarning = async ({
  businessId,
  userId,
  userEmail,
  receiptId,
  formValues,
  validation,
}: {
  businessId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  receiptId?: string | null;
  formValues?: TaxReceiptFormValues;
  validation?: TaxReceiptSequenceValidation;
}) => {
  if (!businessId || !userId) return null;

  const collectionRef = collection(
    db,
    'businesses',
    businessId,
    'ncfLedgerAudit',
  );

  const snapshot = toPlainObject({
    validation,
    formValues,
  });

  const docData = {
    createdAt: serverTimestamp(),
    warningCode: buildWarningCode(),
    userId,
    userEmail: userEmail ?? null,
    receiptId: receiptId ?? null,
    prefix: validation?.prefix ?? null,
    nextDigits: validation?.nextDigits ?? null,
    nextDigitsLength: validation?.nextDigitsLength ?? null,
    sequenceLength: validation?.sequenceLength ?? null,
    hasImmediateNextConflict: Boolean(validation?.hasImmediateNextConflict),
    hasCurrentConflict: Boolean(validation?.hasCurrentConflict),
    snapshot,
  };

  return addDoc(collectionRef, docData);
};
