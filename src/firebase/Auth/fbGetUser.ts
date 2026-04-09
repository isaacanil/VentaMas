import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { normalizeFirestoreUser } from '@/utils/users/normalizeFirestoreUser';

type FirestoreUserData = Record<string, unknown>;
type FirestoreUserRecord = FirestoreUserData & { id: string };

export const fbGetUser = async (
  userId: string,
): Promise<FirestoreUserData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      // Normalize to avoid relying on the legacy mirror `user.*`.
      return normalizeFirestoreUser(userSnap.id, userSnap.data() ?? {});
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export async function fbGetUsers(): Promise<FirestoreUserRecord[]> {
  const usuariosColeccion = collection(db, 'users');
  const snapshot = await getDocs(usuariosColeccion);
  const listaUsuarios = snapshot.docs.map((doc) => {
    return {
      ...normalizeFirestoreUser(doc.id, doc.data() ?? {}),
    };
  });
  return listaUsuarios;
}
