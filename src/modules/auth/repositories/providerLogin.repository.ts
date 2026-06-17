import {
  GoogleAuthProvider,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import {
  buildSessionInfo,
  storeSessionLocally,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import { auth } from '@/firebase/firebaseconfig';

import {
  assertValidProviderLoginPayload,
  type ProviderLoginResponse,
  type ValidProviderLoginPayload,
} from '../utils/providerLogin';

type ProviderLoginRequest = {
  idToken: string;
  providerId: string;
  sessionInfo?: unknown;
};

const GOOGLE_PROVIDER_ID = 'google.com';
const googleProvider = new GoogleAuthProvider();
const clientLoginWithProviderCallable = createFirebaseCallable<
  ProviderLoginRequest,
  ProviderLoginResponse
>('clientLoginWithProvider');

export const authenticateWithGoogleProvider =
  async (): Promise<ValidProviderLoginPayload> => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const sessionInfo = buildSessionInfo();

    const response = await clientLoginWithProviderCallable({
      idToken,
      providerId: GOOGLE_PROVIDER_ID,
      sessionInfo,
    });
    const payload = response || {};

    assertValidProviderLoginPayload(payload);

    storeSessionLocally({
      sessionToken: payload.sessionToken,
      sessionExpiresAt: payload.sessionExpiresAt,
      sessionId: payload.session?.id || payload.sessionToken,
    });

    await signOut(auth);
    await signInWithCustomToken(auth, payload.firebaseCustomToken);

    return payload;
  };
