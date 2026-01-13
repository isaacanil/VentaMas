import { httpsCallable } from 'firebase/functions';

import { login } from '@/features/auth/userSlice';
import { buildSessionInfo, storeSessionLocally } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

export interface FbSignInUser {
  id: string;
  name?: string;
  displayName?: string;
  realName?: string;
  businessID?: string;
  role?: string;
  [key: string]: any;
}

export interface FbSignInResult {
  user: FbSignInUser;
  session?: any;
  activeSessions?: any[];
}

const clientLoginCallable = httpsCallable(functions, 'clientLogin');

export function updateAppState(dispatch: any, userData: FbSignInUser) {
  dispatch(
    login({
      uid: userData.id,
      displayName:
        userData?.displayName || userData?.realName || userData?.name,
    }),
  );
}

export const fbSignIn = async (user: { name: string; password?: string }): Promise<FbSignInResult> => {
  try {
    const sessionInfo = buildSessionInfo();
    const response = await clientLoginCallable({
      username: user.name,
      password: user.password,
      sessionInfo,
    });

    const payload = (response?.data || {}) as any;
    if (!payload.ok) {
      throw new Error(payload?.message || 'Error al iniciar sesión');
    }

    storeSessionLocally({
      sessionToken: payload.sessionToken,
      sessionExpiresAt: payload.sessionExpiresAt,
      sessionId: payload.session?.id || payload.sessionToken,
    });

    return {
      user: payload.user,
      session: payload.session,
      activeSessions: payload.activeSessions || [],
    };
  } catch (error: any) {
    throw new Error(error?.message || 'Error al iniciar sesión');
  }
};
