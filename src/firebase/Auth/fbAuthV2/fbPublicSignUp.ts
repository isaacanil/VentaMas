import { signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import {
  buildSessionInfo,
  storeSessionLocally,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { auth, functions } from '@/firebase/firebaseconfig';
import { normalizeCurrentUserContext } from '@/utils/auth-adapter';

export interface PublicSignUpInput {
  name?: string;
  realName?: string | null;
  email: string;
  password: string;
}

export interface PublicSignUpResponse {
  ok?: boolean;
  userId?: string;
  user?: Record<string, unknown>;
  sessionToken?: string;
  sessionExpiresAt?: number;
  session?: { id?: string } | null;
  activeSessions?: unknown[];
  businessHasOwners?: boolean;
  firebaseCustomToken?: string;
}

const clientPublicSignUpCallable = httpsCallable(functions, 'clientPublicSignUp');

const toLegacyCompatibleAuthPayload = (userData: Record<string, unknown>) => {
  const normalized = normalizeCurrentUserContext(userData);
  const uid = normalized.uid || (userData.id as string | undefined) || null;

  return {
    uid: uid || undefined,
    id: uid || undefined,
    displayName:
      normalized.displayName ||
      (userData.displayName as string | undefined) ||
      (userData.realName as string | undefined) ||
      (userData.name as string | undefined),
    username:
      (userData.name as string | undefined) || normalized.displayName || undefined,
    realName: (userData.realName as string | undefined) || undefined,
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
    businessHasOwners:
      typeof userData.businessHasOwners === 'boolean'
        ? userData.businessHasOwners
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

export const fbPublicSignUp = async (
  input: PublicSignUpInput,
): Promise<{ user: Record<string, unknown> }> => {
  const sessionInfo = buildSessionInfo();
  const response = await clientPublicSignUpCallable({
    ...(input.name ? { name: input.name } : {}),
    ...(input.realName !== undefined ? { realName: input.realName } : {}),
    email: input.email,
    password: input.password,
    sessionInfo,
  });

  const payload = (response?.data || {}) as PublicSignUpResponse;
  if (!payload.ok || !payload.user) {
    throw new Error('No se pudo crear la cuenta.');
  }

  await ensureFirebaseAuthSession(
    payload.userId || (payload.user.id as string | undefined),
    payload.firebaseCustomToken,
  );

  storeSessionLocally({
    sessionToken: payload.sessionToken,
    sessionExpiresAt: payload.sessionExpiresAt,
    sessionId: payload.session?.id || payload.sessionToken,
  });

  return {
    user: toLegacyCompatibleAuthPayload({
      ...payload.user,
      businessHasOwners:
        typeof payload.businessHasOwners === 'boolean'
          ? payload.businessHasOwners
          : false,
    }),
  };
};
