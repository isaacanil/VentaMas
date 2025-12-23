// client/backfillUserNumbers.js
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

/**
 * Backfill de números de usuario desde el cliente.
 * Consulta todos los usuarios de un negocio, asigna un número secuencial
 * a los que no lo tengan y actualiza el contador en Firestore.
 *
 * @param {string} businessID - ID del negocio
 * @returns {Promise<{ok: boolean, last: number, processed: number}>}
 */
export async function backfillUserNumbers(businessID) {
  if (!businessID || typeof businessID !== 'string') {
    throw new Error('Debe proporcionar un businessID válido');
  }

  // 1. Obtiene el último contador guardado (o 0 si no existe)
  const counterRef = doc(db, `businesses/${businessID}/counters/users`);
  const counterSnap = await getDoc(counterRef);
  let currentNumber = 0;
  if (counterSnap.exists()) {
    const data = counterSnap.data();
    if (typeof data.value === 'number') currentNumber = data.value;
  }

  // 2. Consulta todos los usuarios del negocio, ordenados por createdAt ascendente
  const usersCol = collection(db, 'users');
  const usersQuery = query(
    usersCol,
    where('user.businessID', '==', businessID),
    orderBy('user.createAt', 'asc'),
  );
  const usersSnap = await getDocs(usersQuery);
  if (usersSnap.empty) {
    return { ok: true, last: currentNumber, processed: 0 };
  }

  // 3. Prepara un batch para actualizaciones
  const batch = writeBatch(db);
  let processed = 0;

  usersSnap.forEach((docSnap) => {
    const user = docSnap.data().user;
    if (user.number == null) {
      currentNumber++;
      batch.update(docSnap.ref, { 'user.number': currentNumber });
      processed++;
    } else if (typeof user.number === 'number' && user.number > currentNumber) {
      currentNumber = user.number;
    }
  });

  // 4. Actualiza el documento de contadores
  batch.set(counterRef, { value: currentNumber }, { merge: true });

  // 5. Ejecuta el batch
  await batch.commit();

  return { ok: true, last: currentNumber, processed };
}

// Ejemplo de uso:
// import { backfillUserNumbers } from './client/backfillUserNumbers';
// backfillUserNumbers('miBusinessID')
//   .then(res => console.log('Backfill completado:', res))
//   .catch(err => console.error('Error en backfill:', err));

export const useBackfillUserNumbers = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.businessID) return;

      // Check if backfill has already been executed for this business
      const backfillKey = `backfill-user-numbers-${user.businessID}`;
      if (localStorage.getItem(backfillKey) === 'completed') {
        console.log('Backfill already executed for this business');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await backfillUserNumbers(user.businessID);
        setData(result);

        // Save to localStorage that backfill has been completed
        localStorage.setItem(backfillKey, 'completed');
      } catch (err) {
        console.error('Error al hacer backfill de números de usuario:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { loading, data, error };
};
