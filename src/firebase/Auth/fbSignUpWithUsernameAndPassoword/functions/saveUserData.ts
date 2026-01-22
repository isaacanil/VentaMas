import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import { db } from '@/firebase/firebaseconfig';

import type { SignUpUserInput } from './types';

export const saveUserData = async (
  userAuth: User,
  user: SignUpUserInput,
): Promise<void> => {
  try {
    const uid = userAuth.uid;
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      user: {
        ...user,
        id: uid,
        active: true,
        createAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error al guardar los datos del usuario:', error);
    throw error;
  }
};
