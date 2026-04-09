import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase/firebaseconfig';

type FirestoreUserData = Record<string, unknown> | null;

export const fbDeleteUser = async (
  uid: string,
  password: string,
): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);

  // Obtiene los datos del usuario antes de intentar borrarlo
  let userData: FirestoreUserData = null;
  try {
    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      userData = docSnapshot.data() ?? null;
    } else {
      console.error(`User ${uid} not found in database`);
      return;
    }
  } catch (error) {
    console.error(`Error fetching user data: ${error}`);
    return;
  }

  // Intenta borrar el documento de la base de datos
  try {
    await deleteDoc(userDocRef);
    // User deleted from database successfully
  } catch (error) {
    console.error(`Error deleting user from database: ${error}`);
    return; // Si falla, no intenta borrar la autenticación
  }

  // Intenta borrar la autenticación del usuario
  try {
    if (!auth.currentUser?.email) {
      throw new Error('No hay usuario autenticado para reautenticar.');
    }
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password,
    );

    const result = await reauthenticateWithCredential(
      auth.currentUser,
      credential,
    );

    await deleteUser(result.user);
    // User deleted from auth successfully
  } catch (error) {
    console.error(`Error deleting user from auth: ${error}`);
    // Si falla, intenta restaurar el documento en la base de datos
    try {
      await setDoc(userDocRef, userData);
      // User restored in database successfully
    } catch (restoreError) {
      console.error(`Error restoring user in database: ${restoreError}`);
    }
  }
};
