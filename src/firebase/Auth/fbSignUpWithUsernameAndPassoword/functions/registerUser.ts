import {
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  type UserCredential,
} from 'firebase/auth';

import { auth } from '@/firebase/firebaseconfig';

import { saveUserData } from './saveUserData';
import type { SignUpUserInput } from './types';
import { updateUserProfile } from './updateUserProfile';

export const registerUser = async (
  user: SignUpUserInput,
): Promise<UserCredential> => {
  const { email, password, name } = user;
  try {
    // Guarda el token de autenticación del usuario actual
    const originalUser = auth.currentUser;
    if (originalUser) {
      const originalToken = await originalUser.getIdToken();
      localStorage.setItem('authToken', originalToken);
    }

    // Crea el nuevo usuario
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateUserProfile(userCredential.user, name);
    await saveUserData(userCredential.user, user);

    // Cierra la sesión del nuevo usuario
    await signOut(auth);

    // Restaura la sesión del usuario original
    const originalToken = originalUser
      ? localStorage.getItem('authToken')
      : null;
    if (originalUser && originalToken) {
      await signInWithCustomToken(auth, originalToken);
      localStorage.removeItem('authToken'); // limpia el token guardado
    }

    return userCredential;
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    throw error;
  }
};
