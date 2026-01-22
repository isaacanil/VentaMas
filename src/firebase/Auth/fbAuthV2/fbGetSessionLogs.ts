import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

import { buildSessionInfo, getStoredSession } from './sessionClient';

type SessionLogsOptions = {
  userId?: string | null;
  limit?: number;
};

type SessionLog = Record<string, unknown>;

type SessionLogsCallableRequest = {
  sessionToken: string;
  targetUserId?: string | null;
  limit: number;
  sessionInfo: ReturnType<typeof buildSessionInfo>;
};

type SessionLogsResponse = {
  ok?: boolean;
  message?: string;
  logs?: unknown[];
};

const listSessionLogsCallable = httpsCallable<
  SessionLogsCallableRequest,
  SessionLogsResponse
>(functions, 'clientListSessionLogs');

/**
 * Obtiene los registros de sesiones del usuario actual o de un usuario objetivo (si se permiten privilegios).
 * @param {Object} [options]
 * @param {string|null} [options.userId] - Usuario objetivo cuyos registros se desean consultar.
 * @param {number} [options.limit=100] - Número máximo de registros a recuperar.
 * @returns {Promise<Array>} Lista de registros de sesión.
 */
export const fbGetSessionLogs = async ({
  userId = null,
  limit = 100,
}: SessionLogsOptions = {}): Promise<SessionLog[]> => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  const response = await listSessionLogsCallable({
    sessionToken,
    targetUserId: userId,
    limit,
    sessionInfo: buildSessionInfo({
      metadata: {
        requestSource: 'session-logs-view',
        requestedAt: Date.now(),
      },
    }),
  });

  const data = response?.data || {};

  if (!data.ok) {
    throw new Error(
      data?.message || 'No se pudo obtener el historial de sesiones.',
    );
  }

  return Array.isArray(data.logs) ? (data.logs as SessionLog[]) : [];
};
