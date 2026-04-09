import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';

type SetPasswordRequest = {
  userId: string;
  newPassword: string;
  sessionToken?: string | null;
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
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }
  try {
    await clientSetUserPasswordCallable({
      userId,
      newPassword,
      sessionToken,
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
