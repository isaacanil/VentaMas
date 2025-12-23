import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const callable = httpsCallable(functions, 'rebuildNcfLedger');

export const rebuildNcfLedger = async ({
  businessId,
  userId,
  ...options
} = {}) => {
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

    const response = await callable(payload);
    return response?.data ?? null;
  } catch (error) {
    console.error('Error al invocar rebuildNcfLedger:', error);
    throw error;
  }
};
