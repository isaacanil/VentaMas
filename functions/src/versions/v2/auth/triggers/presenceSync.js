import { onValueWritten } from 'firebase-functions/v2/database';
import { logger } from 'firebase-functions';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';

const PRESENCE_PATH = '/presence/{userId}/{connectionId}';
const OFFLINE_STALE_MS = 5 * 60 * 1000; // 5 minutos
const ONLINE_STALE_MS = 30 * 1000; // Conexiones online sin latido en 30s se marcan offline

export const syncRealtimePresence = onValueWritten(PRESENCE_PATH, async (event) => {
  const userId = event.params?.userId;
  if (!userId) {
    logger.warn('[presence] Missing userId in params', event.params);
    return;
  }

  const parentRef = event.data?.after?.ref?.parent || event.data?.before?.ref?.parent;
  if (!parentRef) {
    logger.warn('[presence] Missing parent reference for user', userId);
    return;
  }

  const snapshot = await parentRef.get();
  if (!snapshot) {
    logger.warn('[presence] Could not retrieve presence snapshot for', userId);
    return;
  }

  let hasActiveConnections = false;
  let latestSeen = 0;
  let activeConnections = 0;
  const removals = [];
  const now = Date.now();

  snapshot.forEach((child) => {
    const value = child.val();
    if (!value || typeof value !== 'object') {
      removals.push(child.ref.remove());
      return;
    }

    const updatedAt = typeof value.updatedAt === 'number'
      ? value.updatedAt
      : Number(value.updatedAt) || null;
    if (updatedAt && updatedAt > latestSeen) {
      latestSeen = updatedAt;
    }

    if (value.state === 'online') {
      const isFresh = updatedAt && now - updatedAt <= ONLINE_STALE_MS;
      if (isFresh) {
        hasActiveConnections = true;
        activeConnections += 1;
        return;
      }

      removals.push(
        child.ref.set({
          state: 'offline',
          updatedAt: Date.now(),
        })
      );
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

  await db.collection('users').doc(userId).set(presenceUpdate, { merge: true });
});
