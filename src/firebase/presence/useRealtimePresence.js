import {
  goOffline,
  goOnline,
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { useEffect, useRef } from 'react';

import {
  ensureDeviceId,
  getStoredSession,
} from '../Auth/fbAuthV2/sessionClient.js';
import { realtimeDB } from '../firebaseconfig.jsx';

const PRESENCE_BASE_PATH = 'presence';
const HEARTBEAT_INTERVAL_MS = 20 * 1000; // Mantener actualizado el timestamp antes de que el backend lo marque como inactivo

export const useRealtimePresence = (user) => {
  const disconnectHandlerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const presenceRefState = useRef(null);
  const hasConnectedRef = useRef(false);
  const latestUserRef = useRef(user);

  useEffect(() => {
    latestUserRef.current = user;
  }, [user]);

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!user?.uid) return undefined;
    if (!realtimeDB) return undefined;
    if (!realtimeDB.app?.options?.databaseURL) return undefined;

    try {
      goOnline(realtimeDB);
    } catch {
      return undefined;
    }

    hasConnectedRef.current = false;
    presenceRefState.current = null;

    const { sessionId } = getStoredSession();
    const deviceId = ensureDeviceId();
    const resolveConnectionId = () => {
      const baseId = sessionId || deviceId || user.uid;
      if (typeof window === 'undefined') {
        return `${baseId}-${Date.now()}`;
      }

      try {
        const storage = window.sessionStorage;
        const storageKey = `${PRESENCE_BASE_PATH}:${user.uid}`;
        let storedId = storage?.getItem(storageKey);
        if (!storedId) {
          const randomPart =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2);
          storedId = `${baseId}-${randomPart}`;
          storage?.setItem(storageKey, storedId);
        }
        return storedId;
      } catch {
        return `${baseId}-${Date.now()}`;
      }
    };

    const connectionId = resolveConnectionId();

    const presenceRef = ref(
      realtimeDB,
      `${PRESENCE_BASE_PATH}/${user.uid}/${connectionId}`,
    );
    presenceRefState.current = { presenceRef, connectionId };
    const connectedRef = ref(realtimeDB, '.info/connected');

    const unsubscribe = onValue(connectedRef, async (snapshot) => {
      try {
        const isConnected = snapshot?.val();
        if (!isConnected) {
          stopHeartbeat();
          return;
        }

        hasConnectedRef.current = true;

        if (disconnectHandlerRef.current) {
          await disconnectHandlerRef.current.cancel().catch(() => {});
        }

        const disconnectHandler = onDisconnect(presenceRef);
        disconnectHandlerRef.current = disconnectHandler;

        await disconnectHandler
          .set({
            state: 'offline',
            updatedAt: serverTimestamp(),
          })
          .catch(() => {});

        const latestUser = latestUserRef.current || {};
        const payload = {
          state: 'online',
          updatedAt: serverTimestamp(),
          sessionId: sessionId || null,
          deviceId: deviceId || null,
          businessId: latestUser.businessID || null,
          actor: {
            uid: latestUser.uid,
            role: latestUser.role || null,
          },
        };

        await set(presenceRef, payload);
        if (!heartbeatRef.current) {
          heartbeatRef.current = setInterval(() => {
            if (!hasConnectedRef.current) return;
            update(presenceRef, {
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }, HEARTBEAT_INTERVAL_MS);
        }
      } catch {
        /* noop */
      }
    });

    const forceOffline = () => {
      stopHeartbeat();
      try {
        if (hasConnectedRef.current) {
          set(presenceRef, {
            state: 'offline',
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      } finally {
        if (hasConnectedRef.current) {
          goOffline(realtimeDB);
          hasConnectedRef.current = false;
        }
      }
    };

    window.addEventListener('pagehide', forceOffline, true);
    window.addEventListener('beforeunload', forceOffline, true);

    return () => {
      presenceRefState.current = null;
      try {
        unsubscribe && unsubscribe();
      } catch {
        /* Ignore unsubscribe errors */
      }

      stopHeartbeat();
      const disconnectHandler = disconnectHandlerRef.current;
      disconnectHandlerRef.current = null;
      if (disconnectHandler) {
        disconnectHandler.cancel().catch(() => {});
      }

      if (hasConnectedRef.current) {
        set(presenceRef, {
          state: 'offline',
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      window.removeEventListener('pagehide', forceOffline, true);
      window.removeEventListener('beforeunload', forceOffline, true);
      if (hasConnectedRef.current) {
        goOffline(realtimeDB);
        hasConnectedRef.current = false;
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    if (!hasConnectedRef.current) return undefined;

    const presenceRef = presenceRefState.current?.presenceRef;
    if (!presenceRef) return undefined;

    update(presenceRef, {
      businessId: user.businessID || null,
      actor: {
        uid: user.uid,
        role: user.role || null,
      },
      updatedAt: serverTimestamp(),
    }).catch(() => {});

    return undefined;
  }, [user?.uid, user?.businessID, user?.role]);
};

export default useRealtimePresence;
