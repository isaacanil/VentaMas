// client/backfillUserNumbers.js
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  documentId,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

type UserNumberData = {
  number?: number | null;
};

type UserDocData = {
  number?: number | null;
  createdAt?: unknown;
  businessID?: string | null;
  user?: UserNumberData | null;
};

type LegacyUserNode = UserNumberData & {
  createAt?: unknown;
};

type UserDocDataWithLegacy = UserDocData & {
  user?: LegacyUserNode | null;
};

type BackfillResult = {
  ok: boolean;
  last: number;
  processed: number;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
};

const USERS_IN_QUERY_LIMIT = 30;

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (!Array.isArray(items) || items.length === 0 || size <= 0) return [];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    const millis = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(millis) ? millis : null;
  }
  if (typeof value === 'object' && value !== null) {
    const raw = value as {
      seconds?: unknown;
      _seconds?: unknown;
      nanoseconds?: unknown;
      _nanoseconds?: unknown;
    };
    const seconds = Number(raw.seconds ?? raw._seconds);
    const nanoseconds = Number(raw.nanoseconds ?? raw._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      return seconds * 1000 + Math.floor((Number.isFinite(nanoseconds) ? nanoseconds : 0) / 1e6);
    }
  }
  return null;
};

const getUserCreatedAtMillis = (data: UserDocDataWithLegacy): number => {
  const rootMillis = toMillis(data?.createdAt);
  if (typeof rootMillis === 'number') return rootMillis;

  const legacyMillis = toMillis(data?.user?.createAt);
  if (typeof legacyMillis === 'number') return legacyMillis;

  return Number.MAX_SAFE_INTEGER;
};

/**
 * Backfill de números de usuario desde el cliente.
 * Consulta todos los usuarios de un negocio, asigna un número secuencial
 * a los que no lo tengan y actualiza el contador en Firestore.
 *
 * @param {string} businessID - ID del negocio
 * @returns {Promise<{ok: boolean, last: number, processed: number}>}
 */
export async function backfillUserNumbers(
  businessID: string,
): Promise<BackfillResult> {
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

  // 2. Obtiene miembros canónicos del negocio y luego carga users/{uid}
  const membersCol = collection(db, `businesses/${businessID}/members`);
  const membersSnap = await getDocs(membersCol);
  const memberIds = Array.from(
    new Set(
      membersSnap.docs
        .map((docSnap) => docSnap.id)
        .filter((uid): uid is string => Boolean(uid)),
    ),
  );

  if (memberIds.length === 0) {
    return { ok: true, last: currentNumber, processed: 0 };
  }

  const usersCol = collection(db, 'users');
  const userDocSnapshots = (
    await Promise.all(
      chunkArray(memberIds, USERS_IN_QUERY_LIMIT).map((idsChunk) =>
        getDocs(query(usersCol, where(documentId(), 'in', idsChunk))),
      ),
    )
  ).flatMap((snap) => snap.docs);

  if (userDocSnapshots.length === 0) {
    return { ok: true, last: currentNumber, processed: 0 };
  }

  userDocSnapshots.sort((a, b) => {
    const aData = a.data() as UserDocDataWithLegacy;
    const bData = b.data() as UserDocDataWithLegacy;
    const byCreatedAt = getUserCreatedAtMillis(aData) - getUserCreatedAtMillis(bData);
    if (byCreatedAt !== 0) return byCreatedAt;
    return a.id.localeCompare(b.id);
  });

  // 3. Prepara un batch para actualizaciones
  const batch = writeBatch(db);
  let processed = 0;

  userDocSnapshots.forEach((docSnap) => {
    const data = docSnap.data() as UserDocDataWithLegacy;
    const rootNumber = typeof data?.number === 'number' ? data.number : null;
    const user = data?.user;
    const legacyNumber = typeof user?.number === 'number' ? user.number : null;
    const currentUserNumber = rootNumber ?? legacyNumber;

    if (currentUserNumber == null) {
      currentNumber++;
      batch.update(docSnap.ref, { number: currentNumber });
      processed++;
    } else if (currentUserNumber > currentNumber) {
      currentNumber = currentUserNumber;
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
  const [data, setData] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { loading, data, error };
};
