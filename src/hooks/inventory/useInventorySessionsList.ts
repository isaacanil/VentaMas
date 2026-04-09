import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { InventoryEditorInfo, InventorySession, InventoryUser, TimestampLike } from '@/utils/inventory/types';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import {
  formatUserDisplay,
  pickEmbeddedUserName,
  resolveUserDisplayNameFromProfileDoc,
} from '@/domain/inventory/inventorySessionsLogic';
import {
  createInventorySession,
  fetchFirstUserProfileDoc,
  fetchOpenInventorySessionId,
  fetchSessionCounts,
  listenInventorySessions,
  updateInventorySession,
} from '@/firebase/inventory/inventorySessions.repository';

type InventoryUserProfile = InventoryUser & {
  uid?: string;
  id?: string;
  realName?: string;
  name?: string;
  displayName?: string;
  email?: string;
};

type EmbeddedUser = {
  uid?: string | null;
  realName?: string;
  name?: string;
  displayName?: string;
  email?: string;
};

export type InventorySessionDoc = InventorySession & {
  id: string;
  status?: string;
  createdAt?: TimestampLike;
  createdBy?: string | null;
  createdByName?: string | null;
  user?: EmbeddedUser | null;
};

type NameCache = Record<string, string>;
type FlagMap = Record<string, boolean>;
type SessionEditorsMap = Record<string, InventoryEditorInfo[]>;

export function useInventorySessionsList(user: InventoryUserProfile | null) {
  const businessId = user?.businessID || null;
  const sessionsKey = businessId ? `sessions:${businessId}` : null;

  const [sessionsState, setSessionsState] = useState<{
    key: string | null;
    sessions: InventorySessionDoc[];
    openSessionId: string | null;
  }>({ key: null, sessions: [], openSessionId: null });

  const [userNameCache, setUserNameCache] = useState<NameCache>({});
  const userNameCacheRef = useRef<NameCache>(userNameCache);
  const [sessionEditors, setSessionEditors] = useState<SessionEditorsMap>({});
  const [resolvingUIDs, setResolvingUIDs] = useState<FlagMap>({});
  const [loadingEditorsBySession, setLoadingEditorsBySession] =
    useState<FlagMap>({});

  useEffect(() => {
    userNameCacheRef.current = userNameCache;
  }, [userNameCache]);

  const resolveCreatorNames = useCallback(
    async (list: InventorySessionDoc[]) => {
      if (!businessId) return;

      const updates: Array<{ id: string; createdByName: string }> = [];

      for (const s of list) {
        const uid = s.createdBy;
        if (!uid) continue;

        const embeddedName = pickEmbeddedUserName(s.user, uid);
        if (embeddedName && embeddedName !== s.createdByName) {
          try {
            // Best-effort backfill.
            await updateInventorySession({
              businessId,
              sessionId: s.id,
              updates: { createdByName: embeddedName },
            });
          } catch {
            /* ignore */
          }
          updates.push({ id: s.id, createdByName: embeddedName });
          continue;
        }

        let display = userNameCacheRef.current[uid];
        if (!display) {
          setResolvingUIDs((prev) => ({ ...prev, [uid]: true }));
          try {
            const docData = await fetchFirstUserProfileDoc({
              businessId,
              uid,
            });
            display = resolveUserDisplayNameFromProfileDoc(docData, uid);
          } finally {
            setResolvingUIDs((prev) => {
              const { [uid]: _, ...rest } = prev;
              return rest;
            });
          }
          setUserNameCache((prev) => ({ ...prev, [uid]: display! }));
        }

        if (display && s.createdByName !== display) {
          try {
            // Best-effort backfill.
            await updateInventorySession({
              businessId,
              sessionId: s.id,
              updates: { createdByName: display },
            });
          } catch {
            /* ignore */
          }
          updates.push({ id: s.id, createdByName: display });
        }
      }

      if (updates.length) {
        setSessionsState((prev) => {
          if (!sessionsKey || prev.key !== sessionsKey) return prev;
          const nextSessions = prev.sessions.map((p) => {
            const u = updates.find((x) => x.id === p.id);
            return u ? { ...p, createdByName: u.createdByName } : p;
          });
          return { ...prev, sessions: nextSessions };
        });
      }
    },
    [businessId, sessionsKey],
  );

  useEffect(() => {
    if (!businessId || !sessionsKey) return undefined;

    return listenInventorySessions({
      businessId,
      onData: (docs) => {
        const list = docs.map((d) => ({
          id: d.id,
          ...(d.data as Omit<InventorySessionDoc, 'id'>),
        }));
        const open = list.find((s) => s.status === 'open');

        setSessionsState({
          key: sessionsKey,
          sessions: list,
          openSessionId: open ? open.id : null,
        });

        // Best-effort enrichment/backfill.
        Promise.resolve().then(() => resolveCreatorNames(list));
      },
      onError: () => {
        setSessionsState({ key: sessionsKey, sessions: [], openSessionId: null });
      },
    });
  }, [businessId, sessionsKey, resolveCreatorNames]);

  useEffect(() => {
    if (!businessId || !sessionsKey || sessionsState.key !== sessionsKey) return;
    const sessions = sessionsState.sessions;
    if (!sessions?.length) return;

    const pending = sessions.filter((s) => !sessionEditors[s.id]);
    if (!pending.length) return;

    pending.forEach((s) => {
      Promise.resolve().then(async () => {
        try {
          setLoadingEditorsBySession((prev) => ({ ...prev, [s.id]: true }));

          const docs = await fetchSessionCounts({
            businessId,
            sessionId: s.id,
          });

          const editorsMap = new Map<string, InventoryEditorInfo>();
          docs.forEach((data) => {
            const uid = typeof data.updatedBy === 'string' ? data.updatedBy : null;
            if (!uid) return;
            if (!editorsMap.has(uid)) {
              const rawName =
                (data.updatedByName as string | undefined) ||
                userNameCacheRef.current[uid] ||
                uid;
              const name = formatUserDisplay(rawName);
              editorsMap.set(uid, { uid, name });
              setUserNameCache((prev) => (prev[uid] ? prev : { ...prev, [uid]: name }));
            }
          });

          setSessionEditors((prev) => ({
            ...prev,
            [s.id]: Array.from(editorsMap.values()),
          }));
        } catch {
          /* ignore */
        } finally {
          setLoadingEditorsBySession((prev) => {
            const { [s.id]: _, ...rest } = prev;
            return rest;
          });
        }
      });
    });
  }, [businessId, sessionsKey, sessionsState.key, sessionsState.sessions, sessionEditors]);

  const ensureOpenOrCreateSession = useCallback(async (): Promise<string | null> => {
    if (!businessId) return null;

    const openId = await fetchOpenInventorySessionId({ businessId });
    if (openId) return openId;

    const userData: EmbeddedUser = {
      uid: user?.uid ?? null,
    };
    if (user?.realName) userData.realName = user.realName;
    if (user?.name) userData.name = user.name;
    if (user?.displayName) userData.displayName = user.displayName;
    if (user?.email) userData.email = user.email;

    const createdByName =
      (user?.realName && user.realName.trim()) ||
      user?.displayName ||
      user?.name ||
      user?.uid ||
      '';

    const id = await createInventorySession({
      businessId,
      payload: {
        name: `Inventario ${formatLocaleDate(Date.now())}`,
        createdBy: user?.uid ?? null,
        createdByName,
        user: userData,
        status: 'open',
      },
    });
    return id;
  }, [businessId, user?.displayName, user?.email, user?.name, user?.realName, user?.uid]);

  const loading = !!sessionsKey && sessionsState.key !== sessionsKey;
  const sessions =
    sessionsKey && sessionsState.key === sessionsKey ? sessionsState.sessions : [];
  const openSessionId =
    sessionsKey && sessionsState.key === sessionsKey
      ? sessionsState.openSessionId
      : null;

  const editorListBySessionId = useMemo(() => sessionEditors, [sessionEditors]);

  return {
    businessId,
    sessions,
    openSessionId,
    loading,
    userNameCache,
    resolvingUIDs,
    editorListBySessionId,
    loadingEditorsBySession,
    ensureOpenOrCreateSession,
    formatUserDisplay,
    pickEmbeddedUserName,
  };
}
