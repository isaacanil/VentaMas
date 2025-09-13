import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseconfig";

/**
 * Actualiza una Nota de Crédito existente.
 * @param {Object} user - Usuario con businessID.
 * @param {string} creditNoteId - ID de la nota de crédito (document). 
 * @param {Object} updates - Campos a actualizar.
 */
export const fbUpdateCreditNote = async (user, creditNoteId, updates) => {
  if (!user?.businessID) throw new Error("Usuario sin businessID");
  if (!creditNoteId) throw new Error("creditNoteId requerido");

  const creditNoteRef = doc(db, "businesses", user.businessID, "creditNotes", creditNoteId);
  const dataWithTimestamp = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(creditNoteRef, dataWithTimestamp);
};