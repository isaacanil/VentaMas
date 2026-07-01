// src/taxReceipt/utils/taxReceiptQueries.js
import { https, logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

const normalizeTaxReceiptLabel = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

const normalizeTaxReceiptCode = (value) => {
  const normalized = normalizeTaxReceiptLabel(value).replace(/[^A-Z0-9]/g, '');
  if (/^\d$/.test(normalized)) return normalized.padStart(2, '0');
  return normalized;
};

const getTaxReceiptIdentity = (data) => {
  const type = normalizeTaxReceiptCode(data?.type);
  const serie = normalizeTaxReceiptCode(data?.serie ?? data?.series);
  const name = normalizeTaxReceiptLabel(data?.name);

  return {
    name,
    fiscalKey: `${type}${serie}`,
  };
};

const isActiveTaxReceiptDoc = (docSnap) =>
  docSnap.data()?.data?.disabled !== true;

/**
 * Construye y ejecuta la consulta para obtener el recibo fiscal
 * dentro de una transacción.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {string} taxReceiptName
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getTaxReceiptDocFromTx(tx, user, taxReceiptName) {
  if (!user?.businessID || !user?.uid || !taxReceiptName) {
    throw new https.HttpsError(
      'invalid-argument',
      'Parámetros inválidos en getTaxReceiptDocFromTx',
    );
  }

  const receiptsCol = db
    .collection('businesses')
    .doc(user.businessID)
    .collection('taxReceipts');

  const snap = await tx.get(receiptsCol);
  const requestedName = normalizeTaxReceiptLabel(taxReceiptName);
  const activeDocs = snap.docs.filter(isActiveTaxReceiptDoc);
  const matchingDocs = activeDocs.filter((docSnap) => {
    const identity = getTaxReceiptIdentity(docSnap.data()?.data);
    return identity.name === requestedName;
  });

  if (!matchingDocs.length) {
    logger.error(`Recibo fiscal "${taxReceiptName}" no encontrado.`);
    throw new https.HttpsError('not-found', 'Recibo fiscal no encontrado');
  }

  const matchingIds = new Set(matchingDocs.map((docSnap) => docSnap.id));
  const matchingFiscalKeys = new Set(
    matchingDocs
      .map((docSnap) => getTaxReceiptIdentity(docSnap.data()?.data).fiscalKey)
      .filter(Boolean),
  );
  const conflictingDocs = activeDocs.filter((docSnap) => {
    if (matchingIds.has(docSnap.id)) return true;
    const identity = getTaxReceiptIdentity(docSnap.data()?.data);
    return !!identity.fiscalKey && matchingFiscalKeys.has(identity.fiscalKey);
  });

  if (conflictingDocs.length > 1) {
    const duplicateIds = conflictingDocs.map((docSnap) => docSnap.id);
    logger.error('Recibo fiscal duplicado activo detectado.', {
      businessId: user.businessID,
      taxReceiptName,
      duplicateIds,
    });
    throw new https.HttpsError(
      'failed-precondition',
      `Hay comprobantes fiscales duplicados activos para "${taxReceiptName}". Deshabilita o repara los duplicados antes de generar NCF.`,
    );
  }

  return matchingDocs[0];
}

const getTaxReceipt = {
  getTaxReceiptDocFromTx,
};
export default getTaxReceipt;
