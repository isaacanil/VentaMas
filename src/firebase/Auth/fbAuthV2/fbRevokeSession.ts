import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

import { getStoredSession } from './sessionClient';

type RevokeSessionRequest = {
  userId?: string | null;
  sessionId: string;
};

type RevokeSessionCallableRequest = {
  sessionToken: string | null;
  targetToken: string;
  targetUserId?: string | null;
};

type RevokeSessionResponse = {
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
};

const revokeSessionCallable = httpsCallable<
  RevokeSessionCallableRequest,
  RevokeSessionResponse
>(functions, 'clientRevokeSession');

/**
 * Revoca (cierra forzosamente) una sesión específica de un usuario.
 * @param {Object} params
 * @param {string} params.userId - ID del usuario dueño de la sesión (opcional, para validación admin).
 * @param {string} params.sessionId - ID de la sesión a revocar.
 * @returns {Promise<void>}
 */
export const fbRevokeSession = async ({
  userId,
  sessionId,
}: RevokeSessionRequest): Promise<RevokeSessionResponse> => {
  const { sessionToken } = getStoredSession();
  
  /* 
   * Payload esperado por clientRevokeSession:
   * - sessionToken: Token del administrador/usuario que ejecuta la acción.
   * - targetToken: ID de la sesión específica a cerrar.
   * - targetUserId: (Opcional/Nuevo) ID del usuario dueño de la sesión, para permitir a admins cerrar sesiones ajenas.
   */

  try {
    const response = await revokeSessionCallable({
      sessionToken,
      targetToken: sessionId,
      targetUserId: userId,
    });

    const data = response?.data || {};

    if (!data.ok) {
        console.warn('La revocación reportó un error:', data?.message);
        throw new Error(data?.message || 'Error al revocar sesión'); 
    }
    
    return data;
  } catch (error) {
    console.error('Error llamando a clientRevokeSession:', error);
    throw error;
  }
};
