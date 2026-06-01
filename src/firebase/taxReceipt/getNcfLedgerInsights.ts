import { createFirebaseCallable } from '@/firebase/functions/callable';

type NcfLedgerInsightsPayload = {
  businessId: string;
  prefix: string;
  userId: string;
  [key: string]: unknown;
};

const getNcfLedgerInsightsCallable = createFirebaseCallable<
  NcfLedgerInsightsPayload,
  unknown
>('getNcfLedgerInsights');

export const getNcfLedgerInsights = async (
  payload: NcfLedgerInsightsPayload,
): Promise<unknown> => {
  if (!payload?.businessId) {
    throw new Error(
      'businessId es requerido para obtener insights del ledger.',
    );
  }
  if (!payload?.prefix) {
    throw new Error('prefix es requerido para obtener insights del ledger.');
  }
  if (!payload?.userId) {
    throw new Error('userId es requerido para obtener insights del ledger.');
  }

  try {
    return (await getNcfLedgerInsightsCallable(payload)) ?? null;
  } catch (error) {
    console.error('Error al obtener insights del ledger de NCF:', error);
    throw error;
  }
};
