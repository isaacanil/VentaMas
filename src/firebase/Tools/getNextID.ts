import { doc, runTransaction, type Transaction } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

interface CounterDoc {
  value: number;
}

export async function getNextID(
  user: UserIdentity | null | undefined,
  name: string,
  quantity = 1,
  transaction: Transaction | null = null,
): Promise<number> {
  try {
    if (!name) throw new Error('No name provided');
    if (!user?.businessID) throw new Error('No user or businessID provided');
    if (quantity < 1) throw new Error('Quantity debe ser al menos 1');

    const counterRef = doc<CounterDoc>(
      db,
      'businesses',
      user.businessID,
      'counters',
      name,
    );

    if (transaction) {
      const counterSnap = await transaction.get(counterRef);
      const currentValue = counterSnap.data()?.value ?? 0;

      if (counterSnap.exists()) {
        transaction.update(counterRef, { value: currentValue + quantity });
      } else {
        transaction.set(counterRef, { value: quantity });
      }

      return currentValue + 1;
    }

    return await runTransaction(db, async (internalTransaction) => {
      const counterSnap = await internalTransaction.get(counterRef);
      const currentValue = counterSnap.data()?.value ?? 0;

      if (counterSnap.exists()) {
        internalTransaction.update(counterRef, {
          value: currentValue + quantity,
        });
      } else {
        internalTransaction.set(counterRef, { value: quantity });
      }

      return currentValue + 1;
    });
  } catch (error) {
    console.error('Error al obtener el siguiente ID:', error);
    throw error;
  }
}

// Nueva funcion para incrementar el contador dentro de una transaccion
export async function getNextIDInTransaction(
  transaction: Transaction,
  user: UserIdentity,
  name: string,
  quantity = 1,
): Promise<number> {
  const counterRef = doc<CounterDoc>(
    db,
    'businesses',
    user.businessID,
    'counters',
    name,
  );
  const counterSnap = await transaction.get(counterRef);

  const currentValue = counterSnap.data()?.value ?? 0;
  if (counterSnap.exists()) {
    transaction.update(counterRef, { value: currentValue + quantity });
  } else {
    transaction.set(counterRef, { value: quantity });
  }

  return currentValue + 1;
}
