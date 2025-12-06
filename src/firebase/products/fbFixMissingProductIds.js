import { collection, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '../firebaseconfig';

/**
 * Garantiza que cada documento de producto tenga su campo `id`
 * alineado con el identificador real del documento.
 *
 * @param {Object} params
 * @param {string} params.businessID - Identificador del negocio.
 * @param {number} [params.batchSize=400] - Número máximo de operaciones por batch.
 * @returns {Promise<{ total: number, updated: number }>}
 */
export const fbFixMissingProductIds = async ({
  businessID,
  batchSize = 400,
} = {}) => {
  if (!businessID) {
    throw new Error('El businessID es requerido para corregir los productos.');
  }

  const productsRef = collection(db, 'businesses', businessID, 'products');
  const snapshot = await getDocs(productsRef);

  if (snapshot.empty) {
    return {
      total: 0,
      updated: 0,
    };
  }

  let batch = writeBatch(db);
  let ops = 0;
  let updated = 0;
  let total = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  for (const docSnap of snapshot.docs) {
    total += 1;
    const data = docSnap.data();
    const docId = docSnap.id;

    if (data?.id !== docId) {
      batch.set(docSnap.ref, { id: docId }, { merge: true });
      ops += 1;
      updated += 1;
    }

    if (ops >= batchSize) {
      await commitBatch();
    }
  }

  await commitBatch();

  return {
    total,
    updated,
  };
};
