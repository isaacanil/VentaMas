import { collection, getDocs } from 'firebase/firestore';

import { db } from '../firebaseconfig';

import { normalizeProductTaxes } from './fbNormalizeProductTaxes';

/**
 * Normaliza el impuesto (`pricing.tax`) de todos los productos en todos los negocios.
 * Convierte valores almacenados como texto o decimales (0.18) a porcentajes numéricos (18).
 *
 * @param {Object} options
 * @param {boolean} [options.dryRun=false] - Cuando es true solo calcula los cambios sin guardarlos.
 * @param {(progress: { processed: number, total: number, businessID: string }) => void} [options.onProgress]
 *        Callback con el progreso actual.
 * @returns {Promise<{
 *   totalBusinesses: number,
 *   processed: number,
 *   summaries: Array<{
 *     businessID: string,
 *     success: boolean,
 *     summary?: ReturnType<typeof normalizeProductTaxes>,
 *     error?: string,
 *   }>
 * }>}
 */
export const normalizeAllBusinessesProductTaxes = async ({
  dryRun = false,
  onProgress,
} = {}) => {
  const businessesRef = collection(db, 'businesses');
  const businessesSnapshot = await getDocs(businessesRef);
  const total = businessesSnapshot.size;

  const summaries = [];
  let processed = 0;

  for (const docSnap of businessesSnapshot.docs) {
    const businessID = docSnap.id;
    try {
      const summary = await normalizeProductTaxes({ businessID }, { dryRun });
      summaries.push({
        businessID,
        success: true,
        summary,
      });
    } catch (error) {
      summaries.push({
        businessID,
        success: false,
        error: error?.message || String(error),
      });
    }
    processed += 1;
    if (typeof onProgress === 'function') {
      onProgress({ processed, total, businessID });
    }
  }

  return {
    totalBusinesses: total,
    processed,
    summaries,
  };
};
