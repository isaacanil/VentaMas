import { createFirebaseCallable } from '@/firebase/functions/callable';

type RebuildNcfLedgerPayload = {
  businessId: string;
  userId: string;
  [key: string]: unknown;
};

const rebuildNcfLedgerCallable = createFirebaseCallable<
  RebuildNcfLedgerPayload,
  unknown
>('rebuildNcfLedger');

export const rebuildNcfLedger = async ({
  businessId,
  userId,
  ...options
}: Partial<RebuildNcfLedgerPayload> = {}) => {
  if (!businessId) {
    throw new Error(
      'businessId es requerido para reconstruir el ledger de NCF.',
    );
  }
  if (!userId) {
    throw new Error('userId es requerido para reconstruir el ledger de NCF.');
  }

  try {
    const payload = {
      businessId,
      userId,
      ...options,
    };

    return (await rebuildNcfLedgerCallable(payload)) ?? null;
  } catch (error) {
    console.error('Error al invocar rebuildNcfLedger:', error);
    throw error;
  }
};
