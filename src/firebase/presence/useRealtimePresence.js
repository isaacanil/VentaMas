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

    goOnline(realtimeDB);

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
    const connectedRef = ref(realtimeDB, '.info/connected');

    const unsubscribe = onValue(connectedRef, async (snapshot) => {
      try {
        const isConnected = snapshot?.val();
        if (!isConnected) {
          stopHeartbeat();
          return;
        }

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

        const payload = {
          state: 'online',
          updatedAt: serverTimestamp(),
          sessionId: sessionId || null,
          deviceId: deviceId || null,
          businessId: user.businessID || null,
          actor: {
            uid: user.uid,
            role: user.role || null,
          },
        };

        await set(presenceRef, payload);
        if (!heartbeatRef.current) {
          heartbeatRef.current = setInterval(() => {
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
        set(presenceRef, {
          state: 'offline',
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      } finally {
        goOffline(realtimeDB);
      }
    };

    window.addEventListener('pagehide', forceOffline, true);
    window.addEventListener('beforeunload', forceOffline, true);

    return () => {
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

      set(presenceRef, {
        state: 'offline',
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      window.removeEventListener('pagehide', forceOffline, true);
      window.removeEventListener('beforeunload', forceOffline, true);
      goOffline(realtimeDB);
    };
  }, [user?.uid, user?.businessID, user?.role]);
};

export default useRealtimePresence;
