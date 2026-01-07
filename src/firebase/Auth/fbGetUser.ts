// @ts-nocheck
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbGetUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};
//la estructura de los usuarios en la base de datso es un doc que tiene user y luego dentro tiene las propiedades ejemplo para el negocio seria "user.businessID" user es un objeto en el doc ten lo pendiente

export async function fbGetUsers() {
  const usuariosColeccion = collection(db, 'users');
  const snapshot = await getDocs(usuariosColeccion);
  const listaUsuarios = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return listaUsuarios;
}
