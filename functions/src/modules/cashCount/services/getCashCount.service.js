
// src/cashCount/utils/cashCountSalesQueries.js
import { https } from "firebase-functions";

import { db } from "../../../core/config/firebase.js";

/**
 * Construye la query para obtener el cashCount abierto de un cajero.
 * @param {{ uid:string, businessID:string }} user
 */
function buildOpenCashCountQuery(user) {
  const userRef = db.collection("users").doc(user.uid);
  return db
    .collection(`businesses/${user.businessID}/cashCounts`)
    .where("cashCount.state", "==", "open")
    .where("cashCount.opening.employee", "==", userRef)
    .limit(1);
}

/**
 * Devuelve el DocumentSnapshot del cashCount abierto dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getOpenCashCountDocFromTx(tx, user) {
  const q = buildOpenCashCountQuery(user);
  const snap = await tx.get(q);
  if (snap.empty) {
    throw new https.HttpsError("failed-precondition", "No hay cuadre abierto");
  }
  return snap.docs[0];
}

/**
 * Devuelve el DocumentSnapshot de un cashCount por ID dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {string} cashCountId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getCashCountDocByIdFromTx(tx, user, cashCountId) {
  const ref = db.doc(`businesses/${user.businessID}/cashCounts/${cashCountId}`);
  const doc = await tx.get(ref);
  if (!doc.exists) {
    throw new https.HttpsError("not-found", `CashCount ${cashCountId} no existe`);
  }
  return doc;
}
