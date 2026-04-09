import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import {
  resolveUserDisplayNamesBatch,
  collectUIDsForInventoryTable,
} from '@/utils/users/resolveUserDisplayNamesBatch';

import type {
  CountsMetaMap,
  InventorySession,
  InventoryUser,
  ResolvingMap,
} from '@/utils/inventory/types';
import type { Firestore } from 'firebase/firestore';

/**
 * Hook para manejar la resolución y caché de nombres de usuarios involucrados en la tabla de inventario.
 * - Resuelve el nombre "preferido" del usuario actual.
 * - Hidrata un caché de nombres (updatedByName, etc.) en batch para todos los uids presentes.
 * - Evita solicitudes duplicadas y mantiene indicadores de carga por uid y global.
 */
interface UseUserNamesCacheParams {
  db?: Firestore | null;
  user?: InventoryUser | null;
  countsMeta: CountsMetaMap;
  session?: InventorySession | null;
}

interface UseUserNamesCacheResult {
  currentUserResolvedName: string;
  usersNameCache: Record<string, string>;
  resolvingUIDs: ResolvingMap;
  namesBatchLoading: boolean;
}

export function useUserNamesCache({
  db,
  user,
  countsMeta,
  session,
}: UseUserNamesCacheParams): UseUserNamesCacheResult {
  const [currentUserResolvedName, setCurrentUserResolvedName] = useState('');
  const [usersNameCache, setUsersNameCache] = useState<Record<string, string>>(
    {},
  );
  const [resolvingUIDs, setResolvingUIDs] = useState<ResolvingMap>({});
  const [namesBatchLoading, setNamesBatchLoading] = useState(false);

  // Helper para resolver un único usuario (esquema flexible users/{uid})
  const resolveUserDisplayName = useCallback(
    async (uid: string) => {
      if (!uid) return '';
      try {
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = (snap.data() || {}) as {
            user?: Record<string, unknown>;
            realName?: unknown;
            name?: unknown;
            displayName?: unknown;
            fullName?: unknown;
            email?: unknown;
          };
          const nested = (data.user || {}) as Record<string, unknown>;
          const candidates = [
            data.realName,
            nested.realName,
            data.name,
            nested.name,
            data.displayName,
            nested.displayName,
            data.fullName,
            nested.fullName,
            data.email,
            nested.email,
          ];
          for (const c of candidates) {
            if (typeof c === 'string' && c.trim()) return c.trim();
          }
        }
        return uid;
      } catch {
        return uid;
      }
    },
    [db],
  );

  // Resolver nombre preferido del usuario actual
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.uid) {
        if (!cancelled) setCurrentUserResolvedName('');
        return;
      }
      const name = await resolveUserDisplayName(user.uid);
      if (!cancelled) {
        setCurrentUserResolvedName(
          name || user.displayName || user.name || user.email || user.uid,
        );
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    user?.uid,
    user?.displayName,
    user?.email,
    user?.name,
    resolveUserDisplayName,
  ]);

  // Hidratar caché en batch (countsMeta + session)
  useEffect(() => {
    const uids = collectUIDsForInventoryTable({ countsMeta, session });
    if (uids.length === 0) return;

    // Sembrar lo que ya venga con updatedByName
    const seed: Record<string, string> = {};
    for (const key in countsMeta) {
      const m = countsMeta[key];
      if (m?.updatedBy && m?.updatedByName && !usersNameCache[m.updatedBy]) {
        seed[m.updatedBy] = m.updatedByName;
      }
    }
    if (Object.keys(seed).length) {
      setUsersNameCache((prev) => ({ ...prev, ...seed }));
    }

    const missing = uids.filter(
      (uid) => !usersNameCache[uid] && !seed[uid] && !resolvingUIDs[uid],
    );
    if (!missing.length) return;

    let cancelled = false;
    setResolvingUIDs((prev) => ({
      ...prev,
      ...missing.reduce<Record<string, boolean>>((acc, uid) => {
        acc[uid] = true;
        return acc;
      }, {}),
    }));
    setNamesBatchLoading(true);
    (async () => {
      try {
        const loaded = await resolveUserDisplayNamesBatch(
          db,
          missing,
          usersNameCache,
        );
        if (!cancelled && Object.keys(loaded).length > 0) {
          setUsersNameCache((prev) => ({ ...prev, ...loaded }));
        }
      } catch {
        /* noop */
      } finally {
        if (!cancelled) {
          setResolvingUIDs((prev) => {
            const clone = { ...prev };
            missing.forEach((uid) => delete clone[uid]);
            return clone;
          });
          setNamesBatchLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countsMeta, session, usersNameCache, resolvingUIDs, db]);

  return {
    currentUserResolvedName,
    usersNameCache,
    resolvingUIDs,
    namesBatchLoading,
  };
}

export default useUserNamesCache;
