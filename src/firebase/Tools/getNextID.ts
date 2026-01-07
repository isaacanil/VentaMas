// @ts-nocheck
import { doc, runTransaction } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export async function getNextID(user, name, quantity = 1, transaction = null) {
  try {
    if (!name) throw new Error('No name provided');
    if (!user?.businessID) throw new Error('No user or businessID provided');
    if (quantity < 1) throw new Error('Quantity debe ser al menos 1');

    const counterRef = doc(db, 'businesses', user.businessID, 'counters', name);

    // Si recibimos una transacción existente
    if (transaction) {
      const counterSnap = await transaction.get(counterRef);
      let currentValue = 0;

      if (counterSnap.exists()) {
        currentValue = counterSnap.data().value;
        transaction.update(counterRef, { value: currentValue + quantity });
      } else {
        transaction.set(counterRef, { value: quantity });
      }

      return currentValue + 1;
    }
    // Si no hay transacción externa, crear una nueva
    else {
      let startID;
      await runTransaction(db, async (internalTransaction) => {
        const counterSnap = await internalTransaction.get(counterRef);

        let currentValue = 0;
        if (counterSnap.exists()) {
          currentValue = counterSnap.data().value;
          internalTransaction.update(counterRef, {
            value: currentValue + quantity,
          });
        } else {
          internalTransaction.set(counterRef, { value: quantity });
        }

        startID = currentValue + 1;
      });
      return startID;
    }
  } catch (error) {
    console.error('Error al obtener el siguiente ID:', error);
    throw error;
  }
}

// Nueva función para incrementar el contador dentro de una transacción
export async function getNextIDInTransaction(
  transaction,
  user,
  name,
  quantity = 1,
) {
  const counterRef = doc(db, 'businesses', user.businessID, 'counters', name);
  const counterSnap = await transaction.get(counterRef);

  let currentValue = 0;
  if (counterSnap.exists()) {
    currentValue = counterSnap.data().value;
    transaction.update(counterRef, { value: currentValue + quantity });
  } else {
    transaction.set(counterRef, { value: quantity });
  }

  return currentValue + 1; // Devuelve el ID inicial
}
