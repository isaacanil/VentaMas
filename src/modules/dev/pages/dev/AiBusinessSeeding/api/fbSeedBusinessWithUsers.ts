import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

type SeedBusinessUserInput = {
  name: string;
  password: string;
  role: string;
  realName?: string;
  email?: string;
  active?: boolean;
};

type SeedBusinessInput = {
  business: Record<string, unknown>;
  users: SeedBusinessUserInput[];
};

type SeedBusinessResponse = {
  ok?: boolean;
  id?: string;
  users?: Array<Record<string, unknown>>;
};

type SeedBusinessRequest = SeedBusinessInput & {
  sessionToken?: string | null;
};

const clientSeedBusinessWithUsersCallable = httpsCallable<
  SeedBusinessRequest,
  SeedBusinessResponse
>(functions, 'clientSeedBusinessWithUsers');

export const fbSeedBusinessWithUsers = async ({
  business,
  users,
}: SeedBusinessInput): Promise<SeedBusinessResponse> => {
  if (!business || typeof business !== 'object') {
    throw new Error('business requerido');
  }
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('Debes enviar al menos un usuario.');
  }

  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  try {
    const response = await clientSeedBusinessWithUsersCallable({
      business,
      users,
      sessionToken,
    });
    return response?.data || {};
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error creando negocio y usuarios';
    throw new Error(message);
  }
};
