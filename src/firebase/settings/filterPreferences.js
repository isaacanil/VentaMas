import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const SETTINGS_COLLECTION = 'settings';
const DOCUMENT_ID = 'filterPreferences';

const buildDocRef = (userId) =>
  doc(db, 'users', String(userId), SETTINGS_COLLECTION, DOCUMENT_ID);

export const fetchUserFilterPreferences = async (userId) => {
  if (!userId) return null;
  try {
    const preferencesRef = buildDocRef(userId);
    const snapshot = await getDoc(preferencesRef);
    if (!snapshot.exists()) return null;
    return snapshot.data();
  } catch (error) {
    console.error('Error obteniendo preferencias de filtros:', error);
    throw error;
  }
};

export const saveUserFilterPreferences = async (userId, contexts) => {
  if (!userId || typeof contexts !== 'object') return;
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
