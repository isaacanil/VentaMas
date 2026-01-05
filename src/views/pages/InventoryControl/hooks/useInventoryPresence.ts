import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useRef } from 'react';

import type { InventoryUser } from '@/utils/inventory/types';
import type { Firestore } from 'firebase/firestore';

/**
 * Hook para registrar la presencia del usuario en una sesión de inventario.
 * - Actualiza/crea el documento en editingUsers/{uid} cada intervalo.
 * - Sincroniza (si es necesario) el usuario embebido en el documento de la sesión.
 * - Limpia el documento de presence al desmontar.
 */
interface UseInventoryPresenceParams {
  db?: Firestore | null;
  user?: InventoryUser | null;
  sessionId?: string | null;
  currentUserResolvedName?: string;
  intervalMs?: number;
  enabled?: boolean;
}

export function useInventoryPresence({
  db,
  user,
  sessionId,
  currentUserResolvedName,
  intervalMs = 30000,
  enabled = true,
}: UseInventoryPresenceParams) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!db || !sessionId || !user?.businessID || !user?.uid) return;

    const presenceRef = doc(
      db,
      'businesses',
      user.businessID,
      'inventorySessions',
      sessionId,
      'editingUsers',
      user.uid,
    );

    const writePresence = async () => {
      try {
        await setDoc(
          presenceRef,
          {
            uid: user.uid,
            sessionId,
            businessID: user.businessID,
            displayName:
              currentUserResolvedName ||
              user.displayName ||
              user.name ||
              user.email ||
              'Usuario',
            photoURL: user.photoURL || null,
            lastActiveAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch {
        /* noop presence */
      }
    };

    // Primera escritura inmediata
    writePresence();
    intervalRef.current = setInterval(writePresence, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      deleteDoc(presenceRef).catch(() => {});
    };
  }, [
    db,
    enabled,
    sessionId,
    user?.businessID,
    user?.uid,
    user?.displayName,
    user?.email,
    user?.name,
    user?.photoURL,
    currentUserResolvedName,
    intervalMs,
  ]);

  // Sincronizar el usuario embebido en la sesión solo cuando cambie el nombre preferido
  useEffect(() => {
    if (!enabled) return;
    if (!db || !sessionId || !user?.businessID || !user?.uid) return;
    if (!currentUserResolvedName) return;
    const sessionRef = doc(
      db,
      'businesses',
      user.businessID,
      'inventorySessions',
      sessionId,
    );
    (async () => {
      try {
        await updateDoc(sessionRef, {
          user: {
            uid: user.uid,
            realName: currentUserResolvedName,
            name: user.name,
            displayName: user.displayName,
            email: user.email,
          },
          createdByName: currentUserResolvedName,
        });
      } catch {
        /* noop */
      }
    })();
  }, [
    db,
    enabled,
    sessionId,
    user?.businessID,
    user?.uid,
    user?.displayName,
    user?.email,
    user?.name,
    currentUserResolvedName,
  ]);
}

export default useInventoryPresence;
