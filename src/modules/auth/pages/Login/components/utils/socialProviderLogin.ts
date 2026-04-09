import {
  GoogleAuthProvider,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import {
  buildSessionInfo,
  storeSessionLocally,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { auth, functions } from '@/firebase/firebaseconfig';
import type { FbSignInUser } from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';

type ProviderLoginRequest = {
  idToken: string;
  providerId: string;
  sessionInfo?: unknown;
};

type ProviderLoginResponse = {
  ok: boolean;
  user?: FbSignInUser;
  sessionToken?: string;
  sessionExpiresAt?: number;
  session?: { id?: string } | null;
  activeSessions?: unknown[];
  businessHasOwners?: boolean;
  firebaseCustomToken?: string;
  message?: string;
};

type GoogleProviderLoginSuccess = {
  businessHasOwners?: boolean;
  status: 'success';
  user: FbSignInUser;
};

type GoogleProviderLoginError = {
  errorMessage: string;
  status: 'error';
};

export type GoogleProviderLoginResult =
  | GoogleProviderLoginSuccess
  | GoogleProviderLoginError;

const GOOGLE_PROVIDER_ID = 'google.com';
const googleProvider = new GoogleAuthProvider();
const clientLoginWithProviderCallable = httpsCallable<
  ProviderLoginRequest,
  ProviderLoginResponse
>(functions, 'clientLoginWithProvider');

export const runGoogleProviderLogin =
  async (): Promise<GoogleProviderLoginResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const sessionInfo = buildSessionInfo();

      const response = await clientLoginWithProviderCallable({
        idToken,
        providerId: GOOGLE_PROVIDER_ID,
        sessionInfo,
      });

      const payload = response?.data as ProviderLoginResponse;
      if (!payload?.ok || !payload?.sessionToken || !payload?.user) {
        throw new Error(payload?.message || 'Error al iniciar sesión con Google.');
      }

      storeSessionLocally({
        sessionToken: payload.sessionToken,
        sessionExpiresAt: payload.sessionExpiresAt,
        sessionId: payload.session?.id || payload.sessionToken,
      });

      if (!payload.firebaseCustomToken) {
        throw new Error('No se recibió firebaseCustomToken.');
      }

      await signOut(auth);
      await signInWithCustomToken(auth, payload.firebaseCustomToken);

      return {
        businessHasOwners:
          typeof payload.businessHasOwners === 'boolean'
            ? payload.businessHasOwners
            : undefined,
        status: 'success',
        user: payload.user,
      };
    } catch (error: unknown) {
      return {
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : 'No se pudo iniciar sesión con Google.',
        status: 'error',
      };
    }
  };
