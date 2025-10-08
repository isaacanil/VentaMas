import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const COLLECTION = 'authorizationRequests';
const EXPIRED_STATUS = 'expired';

const shouldExpire = (data: any): boolean => {
  if (!data || data.status !== 'pending') {
    return false;
  }

  const expiresAt = data.expiresAt ?? data.expires_at ?? null;
  if (!expiresAt) return false;

  let expiresMillis: number | null = null;

  if (expiresAt instanceof Timestamp) {
    expiresMillis = expiresAt.toMillis();
  } else if (typeof expiresAt === 'number') {
    expiresMillis = expiresAt > 1e12 ? expiresAt : expiresAt * 1000;
  } else if (typeof expiresAt === 'string') {
    const parsed = Number(expiresAt);
    if (!Number.isNaN(parsed)) {
      expiresMillis = parsed > 1e12 ? parsed : parsed * 1000;
    }
  } else if (typeof expiresAt === 'object' && typeof expiresAt?.seconds === 'number') {
    expiresMillis = expiresAt.seconds * 1000;
  }

  return typeof expiresMillis === 'number' && expiresMillis < Date.now();
};

export const expireAuthorizationRequests = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'America/Santo_Domingo',
  },
  async (_event) => {
    const db = getFirestore();
    const businessesSnap = await db.collection('businesses').get();

    const updates: Promise<unknown>[] = [];

    for (const business of businessesSnap.docs) {
      const pendingSnap = await business.ref
        .collection(COLLECTION)
        .where('status', '==', 'pending')
        .select('expiresAt', 'expires_at')
        .limit(200)
        .get();

      pendingSnap.docs.forEach((docSnap) => {
        if (shouldExpire(docSnap.data())) {
          updates.push(docSnap.ref.update({ status: EXPIRED_STATUS }));
        }
      });
    }

    await Promise.allSettled(updates);
  }
);

