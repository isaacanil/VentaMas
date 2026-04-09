import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
  type DatabaseReference,
  type OnDisconnect,
} from 'firebase/database';
import { useEffect, useRef } from 'react';

import { realtimeDB } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

const PRESENCE_BASE_PATH = 'presence';
type PresenceState = 'online' | 'offline' | 'away';

interface PresencePayload {
  state: PresenceState;
  updatedAt: object;
  sessionId: string | null;
  businessId: string | null;
  role: UserIdentity['role'] | null;
  actor: 'user';
}

interface UseRealtimePresenceParams {
  uid: string | null | undefined;
  connectionId: string | null | undefined;
  businessId: string | null | undefined;
  role: UserIdentity['role'] | null | undefined;
  customSessionId: string | null | undefined;
}

export const useRealtimePresence = ({
  uid,
  connectionId,
  businessId,
  role,
  customSessionId,
}: UseRealtimePresenceParams): void => {
  const disconnectHandlerRef = useRef<OnDisconnect | null>(null);
  const presenceRefRef = useRef<DatabaseReference | null>(null);
  const isConnectedRef = useRef(false);
  const currentStateRef = useRef<PresenceState>('offline');
  const lastMetadataSignatureRef = useRef<string | null>(null);
  const latestMetadataRef = useRef<{
    businessId: string | null;
    role: UserIdentity['role'] | null;
    customSessionId: string | null;
  }>({
    businessId: null,
    role: null,
    customSessionId: null,
  });
  const writePresenceRef = useRef<
    ((state: PresenceState, mode?: 'set' | 'update') => Promise<void>) | null
  >(null);

  const normalizeNullableString = (value: string | null | undefined): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  useEffect(() => {
    latestMetadataRef.current = {
      businessId: normalizeNullableString(businessId),
      role: role || null,
      customSessionId: normalizeNullableString(customSessionId),
    };
  }, [businessId, customSessionId, role]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!uid) return undefined;
    if (!connectionId) return undefined;
    if (!realtimeDB) return undefined;
    if (!realtimeDB.app?.options?.databaseURL) return undefined;

    const presenceRef = ref(
      realtimeDB,
      `${PRESENCE_BASE_PATH}/${uid}/${connectionId}`,
    );
    presenceRefRef.current = presenceRef;
    isConnectedRef.current = false;
    currentStateRef.current = 'offline';
    lastMetadataSignatureRef.current = null;

    const connectedRef = ref(realtimeDB, '.info/connected');

    const buildPayload = (state: PresenceState): PresencePayload => ({
      state,
      updatedAt: serverTimestamp(),
      sessionId: latestMetadataRef.current.customSessionId,
      businessId: latestMetadataRef.current.businessId,
      role: latestMetadataRef.current.role,
      actor: 'user',
    });

    const writePresence = async (
      state: PresenceState,
      mode: 'set' | 'update' = 'set',
    ): Promise<void> => {
      const targetRef = presenceRefRef.current;
      if (!targetRef) return;

      currentStateRef.current = state;
      const payload = buildPayload(state);
      if (mode === 'update') {
        await update(targetRef, payload);
        return;
      }
      await set(targetRef, payload);
    };

    writePresenceRef.current = writePresence;

    const syncVisibilityState = () => {
      if (!isConnectedRef.current) return;
      const nextState: PresenceState =
        document.visibilityState === 'hidden' ? 'away' : 'online';

      if (currentStateRef.current === nextState) return;
      void writePresence(nextState).catch(() => undefined);
    };

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      void (async () => {
        try {
          const isConnected = snapshot?.val() === true;
          if (!isConnected) {
            isConnectedRef.current = false;
            return;
          }

          if (disconnectHandlerRef.current) {
            await disconnectHandlerRef.current.cancel().catch(() => undefined);
          }

          const disconnectHandler = onDisconnect(presenceRef);
          disconnectHandlerRef.current = disconnectHandler;

          // Configurar offline en desconexión ANTES de marcar online/away
          // para evitar estados fantasma si el tab se cierra abruptamente.
          await disconnectHandler.set(buildPayload('offline')).catch(() => undefined);

          isConnectedRef.current = true;
          const initialState: PresenceState =
            document.visibilityState === 'hidden' ? 'away' : 'online';
          await writePresence(initialState);
        } catch {
          /* noop */
        }
      })();
    });

    document.addEventListener('visibilitychange', syncVisibilityState, true);

    return () => {
      isConnectedRef.current = false;
      presenceRefRef.current = null;
      writePresenceRef.current = null;
      lastMetadataSignatureRef.current = null;

      try {
        unsubscribe && unsubscribe();
      } catch {
        /* Ignore unsubscribe errors */
      }

      document.removeEventListener('visibilitychange', syncVisibilityState, true);

      const disconnectHandler = disconnectHandlerRef.current;
      disconnectHandlerRef.current = null;

      // Cleanup explícito (logout/expiración): cancelar onDisconnect y luego
      // marcar offline para evitar duplicados o nodos fantasma.
      void (async () => {
        try {
          await disconnectHandler?.cancel().catch(() => undefined);
          await set(presenceRef, buildPayload('offline')).catch(() => undefined);
        } catch {
          /* noop */
        }
      })();
    };
  }, [connectionId, uid]);

  useEffect(() => {
    if (!uid || !connectionId) return undefined;
    if (!isConnectedRef.current) return undefined;
    if (!writePresenceRef.current) return undefined;

    const metadataSignature = JSON.stringify({
      businessId: latestMetadataRef.current.businessId,
      role: latestMetadataRef.current.role,
      customSessionId: latestMetadataRef.current.customSessionId,
    });

    if (lastMetadataSignatureRef.current === metadataSignature) {
      return undefined;
    }

    lastMetadataSignatureRef.current = metadataSignature;
    void writePresenceRef.current(currentStateRef.current, 'update').catch(
      () => undefined,
    );

    return undefined;
  }, [businessId, connectionId, customSessionId, role, uid]);
};

export default useRealtimePresence;
