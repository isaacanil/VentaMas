import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

type SetPasswordRequest = {
  userId: string;
  newPassword: string;
};

type SetPasswordResponse = {
  ok?: boolean;
  message?: string;
};

const clientSetUserPasswordCallable = httpsCallable<
  SetPasswordRequest,
  SetPasswordResponse
>(functions, 'clientSetUserPassword');

export const fbUpdateUserPassword = async (
  userId: string,
  newPassword: string,
): Promise<void> => {
  try {
    await clientSetUserPasswordCallable({
      userId,
      newPassword,
    });
  } catch (error) {
    console.error('Error updating password:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Error actualizando la contraseña';
    throw new Error(message);
  }
};
