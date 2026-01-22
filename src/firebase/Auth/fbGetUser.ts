import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type FirestoreUserData = Record<string, unknown>;
type FirestoreUserRecord = FirestoreUserData & { id: string };

export const fbGetUser = async (
  userId: string,
): Promise<FirestoreUserData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() ?? null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};
//la estructura de los usuarios en la base de datso es un doc que tiene user y luego dentro tiene las propiedades ejemplo para el negocio seria "user.businessID" user es un objeto en el doc ten lo pendiente

export async function fbGetUsers(): Promise<FirestoreUserRecord[]> {
  const usuariosColeccion = collection(db, 'users');
  const snapshot = await getDocs(usuariosColeccion);
  const listaUsuarios = snapshot.docs.map((doc) => {
    const data = doc.data() ?? {};
    return {
      id: doc.id,
      ...data,
    };
  });
  return listaUsuarios;
}
