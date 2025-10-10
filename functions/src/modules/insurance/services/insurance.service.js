import { https, logger } from "firebase-functions";

import { db } from "../../../core/config/firebase.js";

export async function getInsuranceSnap(tx, { user, insuranceId }) {
    if (!user?.businessID) {
      logger.error("User missing businessID in getInsuranceSnap", { uid: user?.uid });
      throw new https.HttpsError(
        "invalid-argument",
        "El usuario no tiene un businessID válido"
      );
    }
    if (!insuranceId || typeof insuranceId !== "string") {
      logger.error("Invalid insuranceId in getInsuranceSnap", { insuranceId });
      throw new https.HttpsError(
        "invalid-argument",
        "El ID de seguro proporcionado es inválido"
      );
    }
  
    const insuranceRef = db.doc(
      `businesses/${user.businessID}/insuranceConfig/${insuranceId}`
    );
    return tx.get(insuranceRef);
  }
  
/**
 * Aplica cambios a la configuración de un seguro dentro de la misma transacción.
 *
 * @param {import('firebase-admin').firestore.Transaction} tx
 * @param {import('firebase-admin').firestore.DocumentSnapshot} snap
 * @param {object} updates             - Campos a actualizar en el documento
 * @returns {void}
 */
export function applyInsuranceUpdate(tx, snap, updates) {
    const ref = snap.ref;
    // Merge para no machacar otros campos
    tx.set(ref, updates, { merge: true });
    logger.info("Applied insurance updates (tx)", {
      path: ref.path,
      updates,
    });
    
  }

export async function getInsurance(tx, { user, insuranceId }) {
    if (!user?.businessID) {
        logger.error("User missing businessID in getInsuranceTransactional", { uid: user?.uid });
        throw new https.HttpsError(
            'invalid-argument',
            'El usuario no tiene un businessID válido'
        );
    }
    if (!insuranceId || typeof insuranceId !== 'string') {
        logger.error("Invalid insuranceId in getInsuranceTransactional", { insuranceId });
        throw new https.HttpsError(
            'invalid-argument',
            'El ID de seguro proporcionado es inválido'
        );
    }

    const insuranceRef = db.doc(`businesses/${user.businessID}/insuranceConfig/${insuranceId}`);
    const snap = await tx.get(insuranceRef);
    if (!snap.exists()) {
        logger.error("Insurance document not found in getInsuranceTransactional", { insuranceId });
        throw new https.HttpsError(
            'not-found',
            'No se encontró el documento de seguro'
        );
    }
    const data = snap.data();
    logger.info("Insurance data retrieved (tx)", { insuranceId, businessID: user.businessID });
    return data;
}