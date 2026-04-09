import { onValueWritten } from 'firebase-functions/v2/database';
import { logger } from 'firebase-functions';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';

const PRESENCE_PATH = '/presence/{userId}/{connectionId}';
const OFFLINE_STALE_MS = 5 * 60 * 1000; // 5 minutos

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null;

const safeJsonStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const isHeartbeatOnlyOnlineUpdate = (event) => {
  const beforeValue = asObject(event?.data?.before?.val?.());
  const afterValue = asObject(event?.data?.after?.val?.());
  if (!beforeValue || !afterValue) return false;

  // Heartbeat normal del cliente: mantiene state=online y solo toca updatedAt.
  // Si ocurre esto y no hubo limpieza/recalculo relevante, evitamos escribir
  // el espejo en Firestore en cada latido para reducir costo y churn.
  if (beforeValue.state !== 'online' || afterValue.state !== 'online') {
    return false;
  }

  const {updatedAt: _beforeUpdatedAt, ...beforeWithoutUpdatedAt} = beforeValue;
  const {updatedAt: _afterUpdatedAt, ...afterWithoutUpdatedAt} = afterValue;

  return (
    safeJsonStringify(beforeWithoutUpdatedAt) ===
    safeJsonStringify(afterWithoutUpdatedAt)
  );
};

export const syncRealtimePresence = onValueWritten(
  PRESENCE_PATH,
  async (event) => {
    const userId = event.params?.userId;
    if (!userId) {
      logger.warn('[presence] Missing userId in params', event.params);
      return;
    }

    const parentRef =
      event.data?.after?.ref?.parent || event.data?.before?.ref?.parent;
    if (!parentRef) {
      logger.warn('[presence] Missing parent reference for user', userId);
      return;
    }

    const snapshot = await parentRef.get();
    if (!snapshot) {
      logger.warn(
        '[presence] Could not retrieve presence snapshot for',
        userId,
      );
      return;
    }

    let hasActiveConnections = false;
    let latestSeen = 0;
    let activeConnections = 0;
    const removals = [];
    const now = Date.now();
    const heartbeatOnlyOnlineUpdate = isHeartbeatOnlyOnlineUpdate(event);

    snapshot.forEach((child) => {
      const value = child.val();
      if (!value || typeof value !== 'object') {
        removals.push(child.ref.remove());
        return;
      }

      const updatedAt =
        typeof value.updatedAt === 'number'
          ? value.updatedAt
          : Number(value.updatedAt) || null;
      if (updatedAt && updatedAt > latestSeen) {
        latestSeen = updatedAt;
      }

      if (value.state === 'online') {
        // Con el hook nuevo, la presencia "online" se sostiene con onDisconnect
        // (conexión real de RTDB), no con heartbeat. Expirar online por updatedAt
        // genera falsos offline cuando la conexión sigue viva pero no hubo writes.
        hasActiveConnections = true;
        activeConnections += 1;
        return;
      }

      // Limpia estados offline antiguos para evitar que se acumulen nodos
      if (!updatedAt || now - updatedAt > OFFLINE_STALE_MS) {
        removals.push(child.ref.remove());
      }
    });

    if (removals.length) {
      await Promise.allSettled(removals);
    }

    // Si fue solo un heartbeat online->online y no hubo limpiezas de nodos
    // (stale/offline), no escribimos el resumen en Firestore.
    // La presencia "precisa" para UI sigue viniendo de Realtime DB.
    if (heartbeatOnlyOnlineUpdate && removals.length === 0) {
      return;
    }

    const presenceUpdate = {
      presence: {
        status: hasActiveConnections ? 'online' : 'offline',
        updatedAt: FieldValue.serverTimestamp(),
        connectionCount: activeConnections,
      },
    };

    if (latestSeen) {
      presenceUpdate.presence.lastSeen = Timestamp.fromMillis(latestSeen);
    } else {
      presenceUpdate.presence.lastSeen = FieldValue.serverTimestamp();
    }

    await db
      .collection('users')
      .doc(userId)
      .set(presenceUpdate, { merge: true });
  },
);
