// @ts-nocheck
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { auth } from '@/firebase/firebaseconfig';

const DEFAULT_REGION =
  typeof import.meta.env.VITE_FIREBASE_REGION === 'string' &&
  import.meta.env.VITE_FIREBASE_REGION
    ? import.meta.env.VITE_FIREBASE_REGION
    : 'us-central1';

const PROJECT_ID =
  typeof import.meta.env.VITE_FIREBASE_PROJECT_ID === 'string' &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
    ? import.meta.env.VITE_FIREBASE_PROJECT_ID
    : null;

const CUSTOM_BASE_URL =
  typeof import.meta.env.VITE_FIREBASE_FUNCTIONS_BASE_URL === 'string' &&
  import.meta.env.VITE_FIREBASE_FUNCTIONS_BASE_URL
    ? import.meta.env.VITE_FIREBASE_FUNCTIONS_BASE_URL
    : null;

const FUNCTIONS_BASE_URL = CUSTOM_BASE_URL
  ? CUSTOM_BASE_URL.replace(/\/$/, '')
  : PROJECT_ID
    ? `https://${DEFAULT_REGION}-${PROJECT_ID}.cloudfunctions.net`
    : null;

const ensureBaseUrl = () => {
  if (!FUNCTIONS_BASE_URL) {
    throw new Error(
      'No se pudo determinar la URL de Cloud Functions. Verifica la configuración.',
    );
  }
  return FUNCTIONS_BASE_URL;
};

interface StoredSession {
  sessionToken: string | null;
  sessionExpiresAt: string | null;
  sessionId: string | null;
  deviceId: string | null;
}

interface FunctionsErrorResponse {
  error?: unknown;
  message?: unknown;
  code?: unknown;
}

interface FunctionsError extends Error {
  code?: string | number;
  status: number;
}

const getStoredSessionSafe = (): StoredSession => {
  const session = getStoredSession() as Partial<StoredSession>;
  return {
    sessionToken:
      typeof session.sessionToken === 'string' ? session.sessionToken : null,
    sessionExpiresAt:
      typeof session.sessionExpiresAt === 'string'
        ? session.sessionExpiresAt
        : null,
    sessionId: typeof session.sessionId === 'string' ? session.sessionId : null,
    deviceId:
      typeof session.deviceId === 'string' ? session.deviceId : null,
  };
};

export const getFunctionsBaseUrl = () => ensureBaseUrl();

export const buildFunctionsAuthHeaders = async () => {
  const headers: Record<string, string> = {};
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
    } catch {
      /* noop */
    }
  }

  const { sessionToken } = getStoredSessionSafe();
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }

  if (!headers.Authorization && !headers['X-Session-Token']) {
    throw new Error('Debes iniciar sesión para continuar.');
  }

  return headers;
};

export const parseFunctionsResponse = async <T = unknown>(
  response: Response,
): Promise<T> => {
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorPayload: FunctionsErrorResponse =
      data && typeof data === 'object' ? (data as FunctionsErrorResponse) : {};

    const message =
      (typeof errorPayload.error === 'string' && errorPayload.error) ||
      (typeof errorPayload.message === 'string' && errorPayload.message) ||
      `Error ${response.status}`;

    const code =
      typeof errorPayload.code === 'string' ||
      typeof errorPayload.code === 'number'
        ? errorPayload.code
        : undefined;

    const error: FunctionsError = Object.assign(new Error(message), {
      status: response.status,
    });

    if (code !== undefined) {
      error.code = code;
    }

    throw error;
  }

  return data as T;
};
