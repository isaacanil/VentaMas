import { onSnapshot, doc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { login, logout } from '@/features/auth/userSlice';
import { auth, db } from '@/firebase/firebaseconfig';
import { normalizeCurrentUserContext } from '@/utils/auth-adapter';

const toLegacyCompatibleAuthPayload = (
  userId: string,
  userData: Record<string, unknown>,
) => {
  const normalized = normalizeCurrentUserContext({
    id: userId,
    uid: userId,
    ...userData,
  });

  const username =
    (typeof userData.name === 'string' && userData.name) || undefined;

  const realName =
    (typeof userData.realName === 'string' && userData.realName) || undefined;

  return {
    uid: normalized.uid || userId,
    id: normalized.uid || userId,
    displayName: normalized.displayName || username,
    username,
    realName,
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
    devBusinessSimulation:
      userData.devBusinessSimulation &&
      typeof userData.devBusinessSimulation === 'object'
        ? userData.devBusinessSimulation
        : undefined,
  };
};

export function useUserDocListener(userId: string | null | undefined): void {
  const dispatch = useDispatch();
  const lastPayloadSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      lastPayloadSignatureRef.current = null;
      return;
    }
    const firebaseAuthUser = auth.currentUser;
    if (!firebaseAuthUser || firebaseAuthUser.uid !== userId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (userSnapshot) => {
        if (userSnapshot.exists()) {
          const data = userSnapshot.data() as Record<string, unknown>;
          const payload = toLegacyCompatibleAuthPayload(userSnapshot.id, data);
          const nextSignature = JSON.stringify(payload);
          if (lastPayloadSignatureRef.current === nextSignature) {
            return;
          }
          lastPayloadSignatureRef.current = nextSignature;
          dispatch(login(payload));
        } else {
          lastPayloadSignatureRef.current = null;
          dispatch(logout());
        }
      },
      (error) => {
        if (error?.code === 'permission-denied') return;
        console.error('user doc listener error:', error);
      },
    );

    return () => {
      lastPayloadSignatureRef.current = null;
      unsubscribe();
    };
  }, [userId, dispatch]);
}
