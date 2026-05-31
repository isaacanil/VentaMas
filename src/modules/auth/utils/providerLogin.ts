import type { FbSignInUser } from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';

export type ProviderLoginResponse = {
  ok?: boolean;
  user?: FbSignInUser;
  sessionToken?: string;
  sessionExpiresAt?: number;
  session?: { id?: string } | null;
  activeSessions?: unknown[];
  businessHasOwners?: boolean;
  firebaseCustomToken?: string;
  message?: string;
};

export type ValidProviderLoginPayload = ProviderLoginResponse & {
  firebaseCustomToken: string;
  ok: true;
  sessionToken: string;
  user: FbSignInUser;
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

export function assertValidProviderLoginPayload(
  payload: ProviderLoginResponse | null | undefined,
): asserts payload is ValidProviderLoginPayload {
  if (!payload?.ok || !payload.sessionToken || !payload.user) {
    throw new Error(payload?.message || 'Error al iniciar sesion con Google.');
  }

  if (!payload.firebaseCustomToken) {
    throw new Error('No se recibio firebaseCustomToken.');
  }
}

export const buildGoogleProviderLoginSuccess = (
  payload: ValidProviderLoginPayload,
): GoogleProviderLoginSuccess => ({
  businessHasOwners:
    typeof payload.businessHasOwners === 'boolean'
      ? payload.businessHasOwners
      : undefined,
  status: 'success',
  user: payload.user,
});
