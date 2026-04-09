import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import { fbNormalizeClients } from './fbNormalizeClients';

type NormalizeClientsSummary = {
  total: number;
  normalized: number;
};

type NormalizeAllBusinessesOptions = {
  onBusiness?: (payload: { businessID: string }) => void;
  onProgress?: (payload: {
    processed: number;
    total: number;
    businessID: string;
    summary: NormalizeClientsSummary | null;
  }) => void;
};

/**
 * Recorre todos los negocios y normaliza la estructura de sus clientes.
 *
 * @param {object} [options]
 * @param {(payload: { businessID: string }) => void} [options.onBusiness] - Callback al iniciar cada negocio.
 * @param {(payload: { processed: number, total: number, businessID: string, summary: object | null }) => void} [options.onProgress]
 * @returns {Promise<{ totalBusinesses: number, summaries: Array<{ businessID: string, success: boolean, summary?: object, error?: string }> }>}
 */
export async function fbNormalizeAllBusinessesClients(
  options: NormalizeAllBusinessesOptions = {},
): Promise<{
  totalBusinesses: number;
  summaries: Array<{
    businessID: string;
    success: boolean;
    summary?: NormalizeClientsSummary;
    error?: string;
  }>;
}> {
  const { onBusiness, onProgress } = options;

  const businessesSnap = await getDocs(collection(db, 'businesses'));
  const totalBusinesses = businessesSnap.size;

  const summaries: Array<{
    businessID: string;
    success: boolean;
    summary?: NormalizeClientsSummary;
    error?: string;
  }> = [];
  let processed = 0;

  for (const businessDoc of businessesSnap.docs) {
    const businessID = businessDoc.id;
    try {
      onBusiness?.({ businessID });

      const summary = await fbNormalizeClients({ businessID });

      processed += 1;
      onProgress?.({ processed, total: totalBusinesses, businessID, summary });

      summaries.push({
        businessID,
        success: true,
        summary,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      processed += 1;
      onProgress?.({
        processed,
        total: totalBusinesses,
        businessID,
        summary: null,
      });

      summaries.push({
        businessID,
        success: false,
        error: message,
      });
    }
  }

  return {
    totalBusinesses,
    summaries,
  };
}
