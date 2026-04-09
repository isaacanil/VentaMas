import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';

type SendVerificationRequest = {
  userId: string;
  email: string;
  sessionToken?: string | null;
};

type SendVerificationResponse = {
  ok?: boolean;
  message?: string;
  expiresAtMillis?: number;
  email?: string;
};

type VerifyCodeRequest = {
  userId: string;
  code: string;
  sessionToken?: string | null;
};

type VerifyCodeResponse = {
  ok?: boolean;
  email?: string;
  message?: string;
};

const sendEmailVerificationCallable = httpsCallable<
  SendVerificationRequest,
  SendVerificationResponse
>(functions, 'clientSendEmailVerification');

const verifyEmailCodeCallable = httpsCallable<
  VerifyCodeRequest,
  VerifyCodeResponse
>(functions, 'clientVerifyEmailCode');

/**
 * Envía un código de verificación al email proporcionado para un usuario.
 */
export const fbSendEmailVerification = async (
  userId: string,
  email: string,
): Promise<SendVerificationResponse> => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('El correo electrónico es requerido.');
  }

  try {
    const response = await sendEmailVerificationCallable({
      userId,
      email: normalizedEmail,
      sessionToken,
    });
    return response?.data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error enviando código de verificación';
    throw new Error(message);
  }
};

/**
 * Verifica el código de verificación enviado por email.
 */
export const fbVerifyEmailCode = async (
  userId: string,
  code: string,
): Promise<VerifyCodeResponse> => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  try {
    const response = await verifyEmailCodeCallable({
      userId,
      code: code.trim(),
      sessionToken,
    });
    return response?.data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error verificando código';
    throw new Error(message);
  }
};
