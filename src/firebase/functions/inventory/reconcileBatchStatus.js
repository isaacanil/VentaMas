import { httpsCallable } from 'firebase/functions';

import { functions } from '../../firebaseconfig';

const callable = httpsCallable(functions, 'reconcileBatchStatusFromStocks');

/**
 * Sincroniza estados y cantidades de lotes en Cloud Functions
 * @param {{ businessId: string; batchIds?: string[]; limit?: number; dryRun?: boolean }} payload
 * @returns {Promise<any>}
 */
export async function reconcileBatchStatus(payload) {
  const { data } = await callable(payload);
  return data;
}
