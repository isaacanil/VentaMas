// fbBackfillBusinessIDProducts.js
//
// Actualiza todos los productos de un negocio que aún no tienen `businessID`.
// Úsalo una sola vez desde tu app (solo admins). Requiere Firebase v9 modular.

import { collection, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '../firebaseconfig'; // ajusta la ruta a tu config

/**
 * Parcha productos antiguos añadiendo businessID.
 * @param {string} bizID  businessID del negocio actual
 */
export async function fbBackfillBusinessIDProducts(bizID) {
  if (!bizID) throw new Error('businessID requerido');

  const prodCol = collection(db, 'businesses', bizID, 'products');
  const snap = await getDocs(prodCol);

  let patched = 0;
  let batch = writeBatch(db);
  let batchWrites = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    // Docs SIN businessID → parchar
    if (!data.businessID) {
      batch.update(docSnap.ref, { businessID: bizID });
      patched++;
      batchWrites++;

      // Commit cada 400 writes (límite 500 por batch)
      if (batchWrites === 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchWrites = 0;
      }
    }
  }

  if (batchWrites > 0) await batch.commit();

  console.log(`✅ Parchados ${patched} productos en ${bizID}`);
  return patched;
}
