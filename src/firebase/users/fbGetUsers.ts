import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import { normalizeFirestoreUser } from '@/utils/users/normalizeFirestoreUser';

type BusinessUser = Record<string, unknown> & { number: number };

type CurrentUser = {
  businessID?: string | null;
  businessId?: string | null;
};

type UsersCallback = (users: BusinessUser[]) => void;
type ErrorCallback = (error: unknown) => void;
type LoadCallback = () => void;

const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
]);
const FIRESTORE_IN_QUERY_LIMIT = 30;

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  return null;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const hasPlatformDevRole = (userData: Record<string, unknown>): boolean => {
  const root = asRecord(userData);
  const rootPlatformRoles = asRecord(root.platformRoles);
  return rootPlatformRoles.dev === true;
};

const resolveGlobalRole = (userData: Record<string, unknown>): string | null => {
  if (hasPlatformDevRole(userData)) return 'dev';

  const normalized = normalizeRoleId(userData.activeRole || userData.role);
  return normalized || null;
};

const resolveMembershipRole = (raw: unknown): string | null => {
  const membership = asRecord(raw);
  return (
    normalizeRoleId(membership.activeRole) ||
    normalizeRoleId(membership.role) ||
    null
  );
};

const resolveEffectiveUserRole = (
  userData: Record<string, unknown>,
  membershipRole: string | null,
): string | null => {
  const globalRole = resolveGlobalRole(userData);
  if (globalRole === 'dev') return 'dev';

  return (
    normalizeRoleId(membershipRole) ||
    globalRole ||
    null
  );
};

const withResolvedRole = (
  uid: string,
  businessId: string,
  userData: Record<string, unknown>,
  membershipRole: string | null,
): Record<string, unknown> => {
  const normalizedUser = normalizeFirestoreUser(uid, userData);
  const resolvedRole = resolveEffectiveUserRole(userData, membershipRole);

  return {
    ...normalizedUser,
    businessID: toCleanString(normalizedUser.businessID) || businessId,
    businessId: toCleanString(normalizedUser.businessId) || businessId,
    activeBusinessId:
      toCleanString(normalizedUser.activeBusinessId) ||
      toCleanString(normalizedUser.businessID) ||
      toCleanString(normalizedUser.businessId) ||
      businessId,
    ...(resolvedRole ? { role: resolvedRole, activeRole: resolvedRole } : {}),
  };
};

const isActiveMembership = (raw: unknown): boolean => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return true;
  }

  const membership = raw as Record<string, unknown>;
  const status = toCleanString(membership.status)?.toLowerCase() || null;
  if (status && INACTIVE_MEMBERSHIP_STATUSES.has(status)) {
    return false;
  }

  const active = toBoolean(membership.active);
  if (active === false) return false;
  return true;
};

const chunkIds = (ids: string[], size: number): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

const buildUserSortKey = (userData: Record<string, unknown>): string => {
  return (
    toCleanString(userData.displayName) ||
    toCleanString(userData.name) ||
    toCleanString(userData.email) ||
    ''
  ).toLowerCase();
};

const stripVolatileUserMirrorFields = (
  userData: Record<string, unknown>,
): Record<string, unknown> => {
  const { presence: _presence, ...rest } = userData;
  return rest;
};

const safeSerializeUsers = (users: BusinessUser[]): string => {
  try {
    return JSON.stringify(users);
  } catch {
    // Fallback conservador: si no podemos serializar, forzamos emisión.
    return `${Date.now()}-${Math.random()}`;
  }
};

export const fbGetUsers = (
  currentUser: CurrentUser,
  setUsers: UsersCallback,
  onError?: ErrorCallback,
  onLoad?: LoadCallback,
): (() => void) | undefined => {
  const businessId = currentUser?.businessID ?? currentUser?.businessId ?? null;

  if (!businessId) {
    if (onError) {
      onError(new Error('businessID es requerido para listar usuarios.'));
    }
    if (onLoad) {
      onLoad();
    }
    return;
  }

  const usersRef = collection(db, 'users');
  const membersRef = collection(db, 'businesses', businessId, 'members');

  let userUnsubscribers: Array<() => void> = [];
  const chunkDataMap = new Map<string, Map<string, Record<string, unknown>>>();
  let hasLoadedOnce = false;
  let lastEmittedSignature: string | null = null;

  const emitLoadedOnce = () => {
    if (hasLoadedOnce) return;
    hasLoadedOnce = true;
    if (onLoad) onLoad();
  };

  const clearUserListeners = () => {
    userUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // Ignore unsubscription errors.
      }
    });
    userUnsubscribers = [];
    chunkDataMap.clear();
  };

  const emitUsers = () => {
    const usersById = new Map<string, Record<string, unknown>>();
    chunkDataMap.forEach((chunkMap) => {
      chunkMap.forEach((payload, uid) => {
        usersById.set(uid, payload);
      });
    });

    const sortedUsers = Array.from(usersById.entries())
      .sort((a, b) => {
        const keyA = buildUserSortKey(a[1]);
        const keyB = buildUserSortKey(b[1]);
        return keyA.localeCompare(keyB);
      })
      .map(([, payload]) => stripVolatileUserMirrorFields(payload)) as BusinessUser[];

    const signature = safeSerializeUsers(sortedUsers);
    if (signature !== lastEmittedSignature) {
      lastEmittedSignature = signature;
      setUsers(sortedUsers);
    }
    emitLoadedOnce();
  };

  const membersUnsubscribe = onSnapshot(
    membersRef,
    (membersSnapshot) => {
      const activeMembers = membersSnapshot.docs
        .map((memberDoc) => {
          const membership = memberDoc.data();
          return {
            uid: toCleanString(memberDoc.id),
            role: resolveMembershipRole(membership),
            active: isActiveMembership(membership),
          };
        })
        .filter(
          (
            member,
          ): member is { uid: string; role: string | null; active: true } =>
            Boolean(member.uid) && member.active,
        );

      const memberIds = Array.from(
        new Set(activeMembers.map((member) => member.uid)),
      );
      const memberRoleByUid = new Map(
        activeMembers.map((member) => [member.uid, member.role]),
      );

      clearUserListeners();

      if (memberIds.length === 0) {
        const emptySignature = '[]';
        if (lastEmittedSignature !== emptySignature) {
          lastEmittedSignature = emptySignature;
          setUsers([]);
        }
        emitLoadedOnce();
        return;
      }

      const chunks = chunkIds(memberIds, FIRESTORE_IN_QUERY_LIMIT);
      chunks.forEach((chunk, index) => {
        const chunkKey = `chunk-${index}`;
        const usersQuery = query(usersRef, where(documentId(), 'in', chunk));
        const unsubscribe = onSnapshot(
          usersQuery,
          (usersSnapshot) => {
            const usersInChunk = new Map<string, Record<string, unknown>>();
            usersSnapshot.docs.forEach((userDoc) => {
              const userData = (userDoc.data() ?? {}) as Record<string, unknown>;
              const membershipRole = memberRoleByUid.get(userDoc.id) || null;
              usersInChunk.set(
                userDoc.id,
                withResolvedRole(userDoc.id, businessId, userData, membershipRole),
              );
            });
            chunkDataMap.set(chunkKey, usersInChunk);
            emitUsers();
          },
          (error) => {
            if (onError) {
              onError(error);
            } else {
              console.error('Error fetching users chunk: ', error);
            }
            emitLoadedOnce();
          },
        );
        userUnsubscribers.push(unsubscribe);
      });
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error('Error fetching business members: ', error);
      }
      emitLoadedOnce();
    },
  );

  return () => {
    clearUserListeners();
    try {
      membersUnsubscribe();
    } catch {
      // Ignore unsubscription errors.
    }
  };
};
