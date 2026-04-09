import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';

type SignUpInput = {
  name: string;
  password: string;
  businessID: string;
  role: string;
  [key: string]: unknown;
};

type SignUpRequest = {
  userData: SignUpInput;
  sessionToken?: string | null;
};

type SignUpResponse = {
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
};

const clientSignUpCallable = httpsCallable<SignUpRequest, SignUpResponse>(
  functions,
  'clientSignUp',
);

const validateUserInput = ({
  name,
  password,
  businessID,
  role,
}: SignUpInput): void => {
  if (!name) {
    throw new Error('Error: Es obligatorio proporcionar un nombre de usuario.');
  }
  if (!password) {
    throw new Error('Error: Es obligatorio proporcionar una contraseña.');
  }
  if (!businessID) {
    throw new Error('Error: Es obligatorio proporcionar un ID de negocio.');
  }
  if (!role) {
    throw new Error('Error: Es obligatorio seleccionar un rol.');
  }
};

export const fbSignUp = async (
  userData: SignUpInput,
): Promise<SignUpResponse> => {
  validateUserInput(userData);
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  try {
    const response = await clientSignUpCallable({ userData, sessionToken });
    return response?.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error creando usuario';
    throw new Error(message);
  }
};
