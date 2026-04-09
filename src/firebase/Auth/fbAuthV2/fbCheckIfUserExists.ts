import { getDocs, query, collection, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

// Función para verificar si el nombre de usuario ya existe
export async function fbCheckIfUserExists(
  name: string,
  excludeId: string | null = null,
): Promise<boolean> {
  const userCollection = collection(db, 'users');
  const rootNameSnapshot = await getDocs(
    query(userCollection, where('name', '==', name)),
  );
  const matchingUsersSnapshot = rootNameSnapshot.docs;

  // Si no hay usuarios con ese nombre, retornar false
  if (matchingUsersSnapshot.length === 0) {
    return false;
  }

  // Si se proporciona excludeId, verificar si todos los usuarios encontrados tienen ese ID
  if (excludeId) {
    // Verificar si algún usuario encontrado tiene un ID diferente al excludeId
    const hasOtherUser = matchingUsersSnapshot.some(
      (doc) => doc.id !== excludeId,
    );
    return hasOtherUser;
  }

  // Si no se proporciona excludeId, retornar true si hay algún usuario con ese nombre
  return true;
}
