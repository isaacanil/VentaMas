import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const SETTINGS_COLLECTION = 'settings';
const DOCUMENT_ID = 'filterPreferences';

interface FilterPreferencesDoc {
  contexts: Record<string, unknown>;
  updatedAt?: unknown;
}

const buildDocRef = (userId: string) =>
  doc(db, 'users', String(userId), SETTINGS_COLLECTION, DOCUMENT_ID);

export const fetchUserFilterPreferences = async (
  userId: string | null | undefined,
): Promise<FilterPreferencesDoc | null> => {
  if (!userId) return null;
  try {
    const preferencesRef = buildDocRef(userId);
    const snapshot = await getDoc(preferencesRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as FilterPreferencesDoc;
  } catch (error) {
    console.error('Error obteniendo preferencias de filtros:', error);
    throw error;
  }
};

export const saveUserFilterPreferences = async (
  userId: string | null | undefined,
  contexts: Record<string, unknown>,
): Promise<void> => {
  if (!userId || typeof contexts !== 'object' || contexts === null) return;
  try {
    const preferencesRef = buildDocRef(userId);
    await setDoc(
      preferencesRef,
      {
        contexts,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error guardando preferencias de filtros:', error);
    throw error;
  }
};
