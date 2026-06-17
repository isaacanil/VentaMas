import { doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

interface ErrorRecord {
  user?: string | null;
  business?: string | null;
  id: string;
  createdAt: Date;
  status: 'pending' | 'resolved';
  errorStackTrace: unknown | null;
  errorInfo: unknown | null;
}

export const fbRecordError = async (
  user: UserIdentity | null | undefined,
  errorStackTrace: unknown,
  errorInfo: unknown,
): Promise<void> => {
  try {
    if (errorStackTrace == null && errorInfo == null) return;
    const errorId = nanoid(12);
    const errorRef = doc(db, 'errors', errorId);
    const error: ErrorRecord = {
      user: user?.uid ?? user?.id ?? null,
      business:
        user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null,
      id: errorId,
      createdAt: new Date(),
      status: 'pending',
      errorStackTrace: errorStackTrace ?? null,
      errorInfo: errorInfo ?? null,
    };
    await setDoc(errorRef, error);
    console.log('Error registrado en Firebase con exito');
  } catch (e) {
    console.error('Error anadiendo documento: ', e);
  }
};
