import { db, FieldValue } from '../../../../core/config/firebase.js';
import { getTaxReceiptDocFromTx } from '../../../../modules/taxReceipt/services/getTaxReceipt.js';

/**
 * Reserva un NCF de forma transaccional.
 * - Lee el recibo fiscal por nombre.
 * - Genera el nuevo código y actualiza el recibo.
 * - Registra un uso 'pending' en ncfUsage.
 * - Retorna { ncfCode, usageId, taxReceiptRef }.
 */
export async function reserveNcf(tx, { businessId, userId, ncfType }) {
  const user = { businessID: businessId, uid: userId };
  const receiptSnap = await getTaxReceiptDocFromTx(tx, user, ncfType);
  const receiptData = receiptSnap.data()?.data;

  // Helper: check if an NCF is already used in any invoice
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

  // Compute candidate codes by advancing sequence without decrementing quantity per skip
  const type = receiptData.type;
  const serie = receiptData.serie;
  const baseSequence = receiptData.sequence; // string
  const inc = receiptData.increase;          // number (or numeric string)
  const qtyBefore = BigInt(receiptData.quantity);
  const incValue = BigInt(inc);

  if (qtyBefore < incValue) {
    throw new Error('Cantidad insuficiente para generar NCF');
  }

  const padSeq = (seqStr, max = 10) => seqStr.toString().slice(-max).padStart(max, '0');
  const computeSeq = (baseSeqStr, increase, steps, max = 10) => {
    const base = BigInt(baseSeqStr);
    const stepInc = BigInt(increase) * BigInt(steps);
    return padSeq((base + stepInc).toString(), max);
  };

  const MAX_ATTEMPTS = 50;
  let attempts = 0;
  let chosenSeq = null;
  let ncfCode = null;
  while (attempts < MAX_ATTEMPTS) {
    const steps = attempts + 1; // first try is +increase once
    const seq = computeSeq(baseSequence, inc, steps, 10);
    const code = `${type}${serie}${seq}`;
    const exists = await isNcfAlreadyUsed(code);
    if (!exists) {
      chosenSeq = seq;
      ncfCode = code;
      break;
    }
    attempts += 1;
  }

  if (!ncfCode || !chosenSeq) {
    throw new Error('No se pudo encontrar un NCF no duplicado');
  }

  // Only decrement quantity ONCE (for the final selected NCF)
  const updatedData = {
    ...receiptData,
    sequence: chosenSeq,
    quantity: (qtyBefore - incValue).toString(),
  };

  // update receipt with new sequence/quantity
  tx.update(receiptSnap.ref, { data: updatedData });

  // create usage record in pending status
  const usageRef = db
    .collection('businesses')
    .doc(businessId)
    .collection('ncfUsage')
    .doc();

  tx.set(usageRef, {
    id: usageRef.id,
    ncfCode,
    taxReceiptName: ncfType,
    generatedAt: FieldValue.serverTimestamp(),
    userId,
    status: 'pending',
  });

  return { ncfCode, usageId: usageRef.id, taxReceiptRef: receiptSnap.ref };
}
