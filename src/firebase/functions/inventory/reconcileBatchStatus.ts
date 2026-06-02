import { createFirebaseCallable } from '@/firebase/functions/callable';

export interface ReconcileBatchStatusPayload {
  businessId: string;
  batchIds?: string[];
  limit?: number;
  dryRun?: boolean;
}

const reconcileBatchStatusCallable = createFirebaseCallable<
  ReconcileBatchStatusPayload,
  unknown
>('reconcileBatchStatusFromStocks');

/**
 * Sincroniza estados y cantidades de lotes en Cloud Functions
 */
export async function reconcileBatchStatus(
  payload: ReconcileBatchStatusPayload,
): Promise<unknown> {
  return reconcileBatchStatusCallable(payload);
}
