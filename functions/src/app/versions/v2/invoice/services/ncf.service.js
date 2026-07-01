import { db, FieldValue } from '../../../../core/config/firebase.js';
import { getTaxReceiptDocFromTx } from '../../../../modules/taxReceipt/services/getTaxReceipt.js';

const DEFAULT_SEQUENCE_LENGTH = 10;
const LEGACY_B_SEQUENCE_LENGTH = 8;

const toPositiveIntegerOrNull = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const inferSequenceLengthFromSequence = (sequence) => {
  if (typeof sequence !== 'string') return null;

  const normalized = sequence.trim();
  if (!/^\d+$/.test(normalized)) return null;

  return normalized.length;
};

const isLegacyBReceipt = (typeCode) =>
  String(typeCode ?? '')
    .trim()
    .toUpperCase()
    .startsWith('B');

const isAllZeroString = (value) =>
  typeof value === 'string' && /^0+$/.test(value.trim());

const resolveSequenceLength = ({ sequenceLength, sequence, typeCode }) => {
  const explicitLength = toPositiveIntegerOrNull(sequenceLength);
  if (explicitLength !== null) return explicitLength;

  const inferredLength = inferSequenceLengthFromSequence(sequence);
  const isBReceipt = isLegacyBReceipt(typeCode);
  if (
    inferredLength !== null &&
    !(
      isBReceipt &&
      inferredLength > LEGACY_B_SEQUENCE_LENGTH &&
      isAllZeroString(sequence)
    )
  ) {
    return inferredLength;
  }

  return isBReceipt ? LEGACY_B_SEQUENCE_LENGTH : DEFAULT_SEQUENCE_LENGTH;
};

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

  // Helper: check if an NCF is already used or reserved in this business.
  const getNcfReservationState = async (code) => {
    const invoicesQuery = db
      .collection('businesses')
      .doc(businessId)
      .collection('invoices')
      .where('data.NCF', '==', code)
      .limit(1);
    const snap = await tx.get(invoicesQuery);
    const usageRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('ncfUsage')
      .doc(code);
    const usageSnap = await tx.get(usageRef);

    return {
      exists: !snap.empty || usageSnap.exists,
      usageRef,
    };
  };

  // Compute candidate codes by advancing sequence without decrementing quantity per skip
  const typeCode = String(receiptData.type ?? '').trim();
  const serieRaw = String(receiptData.serie ?? '').trim();
  const serieCode = serieRaw.padStart(2, '0');
  const seqLength = resolveSequenceLength({
    sequenceLength: receiptData.sequenceLength,
    sequence: receiptData.sequence,
    typeCode,
  });

  const toBigIntSafe = (value, label) => {
    try {
      const normalized =
        value === undefined || value === null || value === ''
          ? '0'
          : String(value);
      return BigInt(normalized);
    } catch {
      throw new Error(`Valor inválido para ${label}`);
    }
  };

  const baseSequenceValue = toBigIntSafe(receiptData.sequence, 'sequence');
  const incValue = toBigIntSafe(receiptData.increase, 'increase');
  const qtyBefore = toBigIntSafe(receiptData.quantity, 'quantity');

  if (!typeCode) {
    throw new Error('Tipo de NCF no configurado');
  }
  if (!serieRaw) {
    throw new Error('Serie de NCF no configurada');
  }

  if (incValue <= 0n) {
    throw new Error('Incremento inválido para generar NCF');
  }

  if (qtyBefore < incValue) {
    throw new Error('Cantidad insuficiente para generar NCF');
  }

  const padSeq = (seqValue) => seqValue.toString().padStart(seqLength, '0');
  const computeSeqValue = (steps) => {
    const stepInc = incValue * BigInt(steps);
    return baseSequenceValue + stepInc;
  };

  const MAX_ATTEMPTS = 50;
  let attempts = 0;
  let chosenSeqValue = null;
  let ncfCode = null;
  let usageRef = null;
  while (attempts < MAX_ATTEMPTS) {
    const steps = attempts + 1; // first try is +increase once
    const seqValue = computeSeqValue(steps);
    const seq = padSeq(seqValue);
    const code = `${typeCode}${serieCode}${seq}`;
    const reservationState = await getNcfReservationState(code);
    const exists = reservationState.exists;
    if (!exists) {
      chosenSeqValue = seqValue;
      ncfCode = code;
      usageRef = reservationState.usageRef;
      break;
    }
    attempts += 1;
  }

  if (!ncfCode || chosenSeqValue === null || !usageRef) {
    throw new Error('No se pudo encontrar un NCF no duplicado');
  }

  const nextSequence = Number(chosenSeqValue);
  if (!Number.isFinite(nextSequence)) {
    throw new Error('Secuencia fuera de rango numérico');
  }

  const remainingQtyBig = qtyBefore - incValue;
  const remainingQty = Number(remainingQtyBig);
  if (!Number.isFinite(remainingQty)) {
    throw new Error('Cantidad restante fuera de rango numérico');
  }

  // Only decrement quantity ONCE (for the final selected NCF)
  const updatedData = {
    ...receiptData,
    sequence: nextSequence,
    quantity: remainingQty,
    sequenceLength: seqLength,
  };

  // update receipt with new sequence/quantity
  tx.update(receiptSnap.ref, { data: updatedData });

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
