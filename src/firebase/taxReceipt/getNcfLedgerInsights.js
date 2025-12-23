import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const callable = httpsCallable(functions, 'getNcfLedgerInsights');

export const getNcfLedgerInsights = async (payload = {}) => {
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
    const response = await callable(payload);
    return response?.data ?? null;
  } catch (error) {
    console.error('Error al obtener insights del ledger de NCF:', error);
    throw error;
  }
};
