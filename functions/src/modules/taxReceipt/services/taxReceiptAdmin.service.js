import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db, serverTimestamp } from '../../../core/config/firebase.js';
/**
 * Incrementa una secuencia de números según un valor específico
 * @param {string} sequence - Secuencia actual
 * @param {number} increase - Valor de incremento
 * @param {number} maxCharacters - Máximo de caracteres para la secuencia
 * @returns {string} Secuencia incrementada
 */
export const increaseSequence = (sequence, increase, maxChars = 10) => {
  const base = BigInt(sequence);
  const inc = BigInt(increase);
  let result = base + inc;

  return result.toString().slice(-maxChars).padStart(maxChars, '0');
};

/**
 * Genera un código NCF a partir de los datos del recibo fiscal
 * @param {Object} receiptData - Datos del recibo fiscal
 * @returns {Object} Objeto con el código NCF y los datos actualizados
 */
export const generateNCFCode = (receiptData) => {
  if (!receiptData || typeof receiptData !== 'object') {
    throw new https.HttpsError(
      'invalid-argument',
      'Datos del recibo inválidos',
    );
  }
  const { type, serie, sequence, increase, quantity } = receiptData;

  if (
    !type ||
    !serie ||
    isNaN(Number(sequence)) ||
    isNaN(Number(increase)) ||
    isNaN(Number(quantity))
  ) {
    throw new https.HttpsError(
      'invalid-argument',
      'Faltan o son inválidos: type, serie, sequence, increase o quantity',
    );
  }

  const qtyBefore = BigInt(quantity);
  const incValue = BigInt(increase);

  if (qtyBefore < incValue) {
    throw new https.HttpsError(
      'failed-precondition',
      `Cantidad insuficiente para generar NCF: disponible ${qtyBefore}, requerido ${incValue}`,
    );
  }

  const newSequence = increaseSequence(sequence, increase, 10);
  const newQuantity = (qtyBefore - incValue).toString();
  const ncfCode = `${type}${serie}${newSequence}`;

  const updatedData = {
    ...receiptData,
    sequence: newSequence,
    quantity: newQuantity,
  };

  return { updatedData, ncfCode };
};

/**
 * Obtiene y actualiza un recibo fiscal según el nombre
 * @param {Object} user - Datos del usuario
 * @param {string} taxReceiptName - Nombre del tipo de comprobante fiscal
 * @returns {Promise<string|null>} Código NCF generado o null
 */
export async function getAndUpdateTaxReceipt(
  tx,
  { user, taxReceiptEnabled, taxReceiptName, taxReceiptSnap },
) {
  if (!user?.businessID || !user?.uid || !taxReceiptName) {
    throw new https.HttpsError(
      'invalid-argument',
      'Parámetros inválidos en getAndUpdateTaxReceiptTransactional',
    );
  }
  if (!taxReceiptEnabled) {
    logger.warn('Recibo fiscal no habilitado', { uid: user.uid });
    return null;
  }

  const businessId = user.businessID;

  const taxReceipt = taxReceiptSnap.data().data;

  // Helper: check if an NCF is already used in any invoice (old or new)
  const isNcfAlreadyUsed = async (code) => {
    const invoicesQuery = db
      .collection('businesses')
      .doc(businessId)
      .collection('invoices')
      .where('data.NCF', '==', code)
      .limit(1);
    const snap = await tx.get(invoicesQuery);
    return !snap.empty;
  };

  // Avoid infinite loops; reasonably cap the number of retries
  const MAX_ATTEMPTS = 50;

  // Compute candidate codes by advancing sequence without decrementing quantity per skip
  const type = taxReceipt.type;
  const serie = taxReceipt.serie;
  const baseSequence = taxReceipt.sequence; // string
  const inc = taxReceipt.increase; // number (or numeric string)
  const qtyBefore = BigInt(taxReceipt.quantity);
  const incValue = BigInt(inc);

  if (qtyBefore < incValue) {
    throw new https.HttpsError(
      'failed-precondition',
      `Cantidad insuficiente para generar NCF`,
    );
  }

  const padSeq = (seqStr, max = 10) =>
    seqStr.toString().slice(-max).padStart(max, '0');
  const computeSeq = (baseSeqStr, increase, steps, max = 10) => {
    const base = BigInt(baseSeqStr);
    const stepInc = BigInt(increase) * BigInt(steps);
    return padSeq((base + stepInc).toString(), max);
  };

  let chosenSeq = null;
  let candidateNCF = null;
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    const steps = attempts + 1; // first try is +increase once
    const seq = computeSeq(baseSequence, inc, steps, 10);
    const code = `${type}${serie}${seq}`;
    const exists = await isNcfAlreadyUsed(code);
    if (!exists) {
      chosenSeq = seq;
      candidateNCF = code;
      break;
    }
    attempts += 1;
  }

  if (!candidateNCF || !chosenSeq) {
    throw new https.HttpsError(
      'failed-precondition',
      'No se pudo encontrar un NCF no duplicado antes de agotar los intentos',
    );
  }

  // Only decrement quantity ONCE (for the final selected NCF), even if we skipped duplicates
  const updatedData = {
    ...taxReceipt,
    sequence: chosenSeq,
    quantity: (qtyBefore - incValue).toString(),
  };

  const usageId = nanoid();
  const usageRef = db
    .collection('businesses')
    .doc(businessId)
    .collection('ncfUsage')
    .doc(usageId);

  // Persist updated tax receipt data reflecting any sequence advances
  tx.update(taxReceiptSnap.ref, { data: updatedData });

  // Register usage as pending; will be marked used/cancelled later in the flow
  tx.set(usageRef, {
    id: usageId,
    ncfCode: candidateNCF,
    taxReceiptName,
    generatedAt: serverTimestamp(),
    userId: user.uid,
    status: 'pending', // Puede ser 'pending', 'used', 'voided'
  });

  logger.info('Tax receipt code generated', {
    ncfCode: candidateNCF,
    usageId,
    businessId,
    userId: user.uid,
  });

  return candidateNCF;
}
