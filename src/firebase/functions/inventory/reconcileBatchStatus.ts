import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const callable = httpsCallable(functions, 'reconcileBatchStatusFromStocks');

export interface ReconcileBatchStatusPayload {
  businessId: string;
  batchIds?: string[];
  limit?: number;
  dryRun?: boolean;
}

/**
 * Sincroniza estados y cantidades de lotes en Cloud Functions
 */
export async function reconcileBatchStatus(
  payload: ReconcileBatchStatusPayload,
): Promise<unknown> {
  const { data } = (await callable(payload)) as HttpsCallableResult<unknown>;
  return data;
}
