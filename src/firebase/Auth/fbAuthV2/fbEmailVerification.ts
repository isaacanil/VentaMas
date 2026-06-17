import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

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

const sendEmailVerificationCallable = createFirebaseCallable<
  SendVerificationRequest,
  SendVerificationResponse
>('clientSendEmailVerification');

const verifyEmailCodeCallable = createFirebaseCallable<
  VerifyCodeRequest,
  VerifyCodeResponse
>('clientVerifyEmailCode');

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
    return await sendEmailVerificationCallable({
      userId,
      email: normalizedEmail,
      sessionToken,
    });
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
    return await verifyEmailCodeCallable({
      userId,
      code: code.trim(),
      sessionToken,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error verificando código';
    throw new Error(message);
  }
};
