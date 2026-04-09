import { signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import { login } from '@/features/auth/userSlice';
import {
  buildSessionInfo,
  storeSessionLocally,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { auth, functions } from '@/firebase/firebaseconfig';
import { normalizeCurrentUserContext } from '@/utils/auth-adapter';

export interface FbSignInUser {
  id: string;
  name?: string;
  displayName?: string;
  realName?: string;
  businessID?: string;
  role?: string;
  businessHasOwners?: boolean;
  [key: string]: any;
}

export interface FbSignInResult {
  user: FbSignInUser;
  session?: any;
  activeSessions?: any[];
  businessHasOwners?: boolean;
}

const clientLoginCallable = httpsCallable(functions, 'clientLogin');

const toLegacyCompatibleAuthPayload = (userData: FbSignInUser) => {
  const normalized = normalizeCurrentUserContext(userData);
  const uid = normalized.uid || userData.id || null;

  return {
    uid: uid || undefined,
    id: uid || undefined,
    displayName:
      normalized.displayName ||
      userData?.displayName ||
      userData?.realName ||
      userData?.name,
    username: userData?.name || normalized.displayName || undefined,
    realName: userData?.realName || undefined,
    email: normalized.email || undefined,
    role: normalized.activeRole || undefined,
    businessID: normalized.activeBusinessId || undefined,
    businessId: normalized.activeBusinessId || undefined,
    activeBusinessId: normalized.activeBusinessId || undefined,
    defaultBusinessId: normalized.defaultBusinessId || undefined,
    lastSelectedBusinessId: normalized.lastSelectedBusinessId || undefined,
    availableBusinesses: normalized.availableBusinesses,
    accessControl: normalized.accessControl,
    memberships: normalized.memberships,
    hasMultipleBusinesses: normalized.hasMultipleBusinesses,
    isLegacyUser: normalized.isLegacyUser,
    contextSource: normalized.source,
    businessHasOwners: userData?.businessHasOwners,
    devBusinessSimulation:
      userData?.devBusinessSimulation &&
      typeof userData.devBusinessSimulation === 'object'
        ? userData.devBusinessSimulation
        : undefined,
  };
};

const ensureFirebaseAuthSession = async (
  userId: unknown,
  firebaseCustomToken: unknown,
): Promise<void> => {
  const resolvedUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!resolvedUserId) {
    throw new Error('No se pudo resolver el userId para Firebase Auth.');
  }

  const currentUser = auth.currentUser;
  if (currentUser?.uid === resolvedUserId) return;

  if (
    typeof firebaseCustomToken !== 'string' ||
    firebaseCustomToken.trim().length === 0
  ) {
    throw new Error('No se recibió firebaseCustomToken.');
  }

  if (currentUser) {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('firebase signOut error:', error);
    }
  }

  await signInWithCustomToken(auth, firebaseCustomToken);
};

export function updateAppState(dispatch: any, userData: FbSignInUser) {
  dispatch(login(toLegacyCompatibleAuthPayload(userData)));
}

export const fbSignIn = async (user: {
  name: string;
  password?: string;
}): Promise<FbSignInResult> => {
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

    await ensureFirebaseAuthSession(payload.userId || payload.user?.id, payload.firebaseCustomToken);

    storeSessionLocally({
      sessionToken: payload.sessionToken,
      sessionExpiresAt: payload.sessionExpiresAt,
      sessionId: payload.session?.id || payload.sessionToken,
    });

    const businessHasOwners =
      typeof payload.businessHasOwners === 'boolean'
        ? payload.businessHasOwners
        : undefined;

    return {
      user: {
        ...payload.user,
        businessHasOwners,
      },
      session: payload.session,
      activeSessions: payload.activeSessions || [],
      businessHasOwners,
    };
  } catch (error: any) {
    throw new Error(error?.message || 'Error al iniciar sesión');
  }
};
