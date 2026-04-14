import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { TaxReceiptUser } from '@/types/taxReceipt';
import { db } from '@/firebase/firebaseconfig';
import { formatNcfCode } from '@/utils/taxReceipt';

/**
 * LEGACY COMPATIBILITY ONLY
 *
 * Este helper avanza la secuencia desde el cliente y escribe directo en
 * Firestore. No debe recibir nuevos callers. La autoridad canónica de
 * reservación/emisión debe vivir en backend (`reserveNcf` y wrappers futuros).
 */
/** 8 dígitos para B, 10 para E */
const defaultLength = (serie?: string) => (serie === 'B' ? 8 : 10);

export const fbGetAndUpdateTaxReceipt = async (
  user: TaxReceiptUser,
  taxReceiptName: string,
) => {
  if (!user?.businessID) {
    console.warn('Missing businessID for tax receipt update.');
    return null;
  }
  try {
    const taxReceiptRef = collection(
      db,
      'businesses',
      user.businessID,
      'taxReceipts',
    );
    const q = query(taxReceiptRef, where('data.name', '==', taxReceiptName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn('No matching tax receipt documents found');
      return null; // Return null or appropriate value if no documents found
    }
    const taxReceiptDoc = querySnapshot.docs[0];
    const docRef = taxReceiptDoc.ref;
    const taxReceiptData = taxReceiptDoc.data();
    const raw = taxReceiptData.data || {};

    // Convertir sequence a número si es string
    const sequence =
      typeof raw.sequence === 'number'
        ? raw.sequence
        : parseInt(raw.sequence, 10) || 0;

    // Asegurar que sequenceLength sea correcto
    const sequenceLength =
      typeof raw.sequenceLength === 'number'
        ? raw.sequenceLength
        : defaultLength(raw.type);

    // Incrementar la secuencia
    const delta = raw.increase || 1;
    const nextSequence = sequence + delta;

    // Actualizar cantidad (si existe)
    const updatedQuantity =
      typeof raw.quantity === 'number' ? raw.quantity - delta : undefined;

    // Preparar actualizaciones
    const updates = {
      'data.sequence': nextSequence,
      'data.sequenceLength': sequenceLength,
    };

    // Solo actualizar cantidad si existe
    if (updatedQuantity !== undefined) {
      updates['data.quantity'] = updatedQuantity;
    }

    // Generar el NCF formateado
    const ncfData = {
      type: raw.type,
      serie: raw.serie,
      sequence: nextSequence,
      sequenceLength: sequenceLength,
    };
    const ncfCode = formatNcfCode(ncfData);

    // Actualizar en Firestore
    await updateDoc(docRef, updates);
    return ncfCode; // Returns the formatted NCF code
  } catch (error) {
    console.error('Error updating Tax Receipt: ', error);
    return null; // Return null or appropriate error handling
  }
};
