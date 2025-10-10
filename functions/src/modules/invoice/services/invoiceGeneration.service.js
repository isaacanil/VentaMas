// functions/src/modules/invoice/services/invoiceGeneration.service.js
import { https, logger } from "firebase-functions";
import { nanoid } from "nanoid";

import { db, serverTimestamp, arrayUnion, Timestamp } from "../../../core/config/firebase.js";
import { getNextIDTransactional } from "../../../core/utils/getNextID.js";
import { addBillToCashCountById } from "../../cashCount/services/cashCount.service.js";

/**
 * Genera una factura final en la base de datos
 * @param {Object} user - Usuario actual
 * @param {Object} cart - Carrito de compras
 * @param {Object} clientData - Datos del cliente
 * @param {string} ncfCode - Código de comprobante fiscal
 * @param {Object} cashCount - Datos del cuadre de caja
 * @param {number} dueDate - Fecha de vencimiento
 * @returns {Promise<Object>} Factura generada
 */

export function checkIfHasDueDate({ cart, dueDate }) {
  if (!dueDate) return cart;
  const date = Timestamp.fromMillis(dueDate);
  return {
    ...cart,
    dueDate: date,
    hasDueDate: true
  }
}

export async function generateFinalInvoice(tx, { user, cart, clientData, ncfCode, cashCountId, dueDate, cashCountSnap }) {
  logger.info("Generating final invoice", { user: user.uid, cartId: cart.id });
  if (!user?.businessID) {
    throw new https.HttpsError('failed-precondition', 'Usuario sin businessID');
  }
  const businessId = user.businessID;
  const id = cart.id || nanoid();

  const userRef = db.doc(`users/${user.uid}`);

  const nextNumberId = await getNextIDTransactional(tx, user, 'lastInvoiceId');

  const invoiceRef = db.doc(`businesses/${businessId}/invoices/${id}`);

  const baseData = {
    ...cart,
    id,
    NCF: ncfCode,
    client: clientData || null,
    cashCountId: cashCountId,
    status: 'completed',
    numberID: nextNumberId,
    date: serverTimestamp(),
    userID: user.uid,
    user: userRef
  };

  if (dueDate) {
    baseData.dueDate = Timestamp.fromMillis(dueDate);
    baseData.hasDueDate = true;
  }

  tx.set(invoiceRef, { data: baseData }, { merge: true });
  logger.info(`Factura generada con ID: ${invoiceRef.id}`);

  await addBillToCashCountById(tx, user, invoiceRef, cashCountSnap);
  logger.info(`Factura añadida al cuadre de caja con ID: ${cashCountId}`);

  return baseData;
}

/**
 * Genera una factura a partir de una preorden
 * @param {Object} user - Usuario actual
 * @param {Object} cart - Carrito de compras (preorden)
 * @param {Object} cashCountId - ID del cuadre de caja
 * @param {string} ncfCode - Código de comprobante fiscal
 * @param {Object} clientData - Datos del cliente
 * @returns {Promise<Object>} Factura generada
 */
export async function generateInvoiceFromPreorder(tx, { user, cart, ncfCode, cashCountId, clientData, cashCountSnap }) {
  if (!cart?.preorderDetails?.isOrWasPreorder || cart?.status !== "pending") {
    throw new Error("Datos de preorden inválidos");
  }

  const businessId = user.businessID;
  const userRef = db.doc(`users/${user.uid}`);
  const id = cart.id;

  const preorderRef = db.doc(`businesses/${businessId}/invoices/${id}`);
  const nextNumberId = await getNextIDTransactional(tx, user, 'lastInvoiceId');

  const historyEntry = {
    type: "invoice",
    status: "completed",
    date: serverTimestamp(),
    userID: user.uid
  };

  const data = {
    ...cart,
    client: clientData,
    status: 'completed',
    date: serverTimestamp(),
    numberID: nextNumberId,
    NCF: ncfCode,
    userID: user.uid,
    cashCountId,
    user: userRef,
    history: arrayUnion(historyEntry)
  };

  tx.set(preorderRef, { data }, { merge: true });
  
  await addBillToCashCountById(tx, user, preorderRef, cashCountSnap);

  logger.info(`Factura generada desde preorden con ID: ${preorderRef.id}`);

  return data;
}
