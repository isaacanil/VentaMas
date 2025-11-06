import { doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";

import { db } from "../firebaseconfig";
import { sanitizeFirestoreDocument } from "../../utils/firebase/sanitizeFirestoreDocument";

const toFirestoreTimestamp = (value) => {
  if (value === undefined || value === null) return value;
  if (value instanceof Timestamp) return value;
  if (typeof value === 'number') return Timestamp.fromMillis(value);
  if (value instanceof Date) return Timestamp.fromDate(value);
  return value;
};

const normalizeHistory = (history = []) => (
  history
    .filter(Boolean)
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const normalizedEntry = { ...entry };
      if (normalizedEntry.date !== undefined && normalizedEntry.date !== null) {
        const parsedDate = toFirestoreTimestamp(normalizedEntry.date);
        if (parsedDate) {
          normalizedEntry.date = parsedDate;
        }
      }
      return normalizedEntry;
    })
);

export const fbUpdatePreOrder = async (user, cartData) => {
  if (!user?.businessID) {
    throw new Error('El negocio asociado al usuario es requerido para actualizar la preventa.');
  }

  if (!cartData?.id) {
    throw new Error('No se encontró un identificador válido para la preventa.');
  }

  const invoiceRef = doc(db, `businesses/${user.businessID}/invoices/${cartData.id}`);

  const preorderDetails = {
    ...(cartData?.preorderDetails || {}),
    isOrWasPreorder: true,
  };

  if (preorderDetails.date) {
    preorderDetails.date = toFirestoreTimestamp(preorderDetails.date);
  } else {
    preorderDetails.date = serverTimestamp();
  }

  const normalizedSelectedType = preorderDetails?.selectedTaxReceiptType ?? cartData?.selectedTaxReceiptType ?? null;

  const payload = {
    ...cartData,
    selectedTaxReceiptType: normalizedSelectedType,
    type: 'preorder',
    status: cartData?.status || 'pending',
    preorderDetails,
    history: normalizeHistory(cartData?.history),
    updatedAt: serverTimestamp(),
  };

  const sanitizedPayload = sanitizeFirestoreDocument(payload);

  await updateDoc(invoiceRef, { data: sanitizedPayload });

  return sanitizedPayload;
};
