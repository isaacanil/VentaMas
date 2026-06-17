import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

type SwitchUserRoleRequest = {
  targetRole: string;
  sessionToken?: string | null;
};

type SwitchUserRoleResponse = {
  ok?: boolean;
  role?: string;
  restored?: boolean;
  message?: string;
};

const clientSwitchUserRoleCallable = createFirebaseCallable<
  SwitchUserRoleRequest,
  SwitchUserRoleResponse
>('clientSwitchUserRole');

export const fbSwitchUserRole = async (targetRole: string): Promise<void> => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  try {
    await clientSwitchUserRoleCallable({
      targetRole,
      sessionToken,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error cambiando el rol';
    throw new Error(message);
  }
};
