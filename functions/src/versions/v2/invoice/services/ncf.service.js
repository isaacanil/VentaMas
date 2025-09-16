import { db, FieldValue } from '../../../../core/config/firebase.js';
import { getTaxReceiptDocFromTx } from '../../../../modules/taxReceipt/services/getTaxReceipt.js';
import { generateNCFCode } from '../../../../modules/taxReceipt/services/taxReceiptAdmin.service.js';

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

  const { ncfCode, updatedData } = generateNCFCode(receiptData);

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
