import { doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

interface ErrorRecord {
  user?: string;
  business?: string | null;
  id: string;
  createdAt: Date;
  status: 'pending' | 'resolved';
  errorStackTrace: unknown;
  errorInfo: unknown;
}

export const fbRecordError = async (
  user: UserIdentity | null | undefined,
  errorStackTrace: unknown,
  errorInfo: unknown,
): Promise<void> => {
  try {
    if (errorStackTrace === null || errorInfo === null) return;
    if (!user) return;
    const errorId = nanoid(12);
    const errorRef = doc(db, 'errors', errorId);
    const error: ErrorRecord = {
      user: user.uid,
      business: user.businessID ?? null,
      id: errorId,
      createdAt: new Date(),
      status: 'pending',
      errorStackTrace,
      errorInfo,
    };
    // Agrega un nuevo documento en la coleccion "errors" con la fecha, la pila de errores y el stack de componentes
    await setDoc(errorRef, error);
    console.log('Error registrado en Firebase con exito');
  } catch (e) {
    console.error('Error anadiendo documento: ', e);
  }
};
