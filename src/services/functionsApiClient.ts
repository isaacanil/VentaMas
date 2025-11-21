import { getStoredSession } from '../firebase/Auth/fbAuthV2/sessionClient';
import { auth } from '../firebase/firebaseconfig';

const DEFAULT_REGION = import.meta.env.VITE_FIREBASE_REGION || 'us-central1';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || null;
const CUSTOM_BASE_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_BASE_URL;

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

  const { sessionToken } = getStoredSession();
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }

  if (!headers.Authorization && !headers['X-Session-Token']) {
    throw new Error('Debes iniciar sesión para continuar.');
  }

  return headers;
};

export const parseFunctionsResponse = async <T = any>(
  response: Response,
): Promise<T> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error: any = new Error(
      data?.error || data?.message || `Error ${response.status}`,
    );
    error.code = data?.code;
    error.status = response.status;
    throw error;
  }
  return data;
};

