import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const clientSetUserPasswordCallable = httpsCallable(
  functions,
  'clientSetUserPassword',
);

export const fbUpdateUserPassword = async (userId, newPassword) => {
  try {
    await clientSetUserPasswordCallable({
      userId,
      newPassword,
    });
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error(error?.message || 'Error actualizando la contraseña');
  }
};
