import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export type FirestoreDoc = { id: string; data: Record<string, unknown> };

export function listenInventorySessions(params: {
  businessId: string;
  onData: (docs: FirestoreDoc[]) => void;
  onError?: (error: unknown) => void;
}): Unsubscribe {
  const { businessId, onData, onError } = params;
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  const noOp: Unsubscribe = () => {};
  if (!businessId || !onData) return noOp;

  const ref = collection(db, 'businesses', businessId, 'inventorySessions');
  const q = query(ref, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          data: (d.data() || {}) as Record<string, unknown>,
        })),
      );
    },
    (err) => {
      if (onError) onError(err);
      onData([]);
    },
  );
}

export async function fetchOpenInventorySessionId(params: {
  businessId: string;
}): Promise<string | null> {
  const { businessId } = params;
  const ref = collection(db, 'businesses', businessId, 'inventorySessions');
  const q = query(ref, where('status', '==', 'open'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0]!.id;
}

export async function createInventorySession(params: {
  businessId: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  const { businessId, payload } = params;
  const ref = collection(db, 'businesses', businessId, 'inventorySessions');
  const docRef = await addDoc(ref, { ...payload, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function updateInventorySession(params: {
  businessId: string;
  sessionId: string;
  updates: Record<string, unknown>;
}): Promise<void> {
  const { businessId, sessionId, updates } = params;
  const ref = doc(db, 'businesses', businessId, 'inventorySessions', sessionId);
  await updateDoc(ref, updates);
}

export async function fetchSessionCounts(params: {
  businessId: string;
  sessionId: string;
}): Promise<Array<Record<string, unknown>>> {
  const { businessId, sessionId } = params;
  const countsRef = collection(
    db,
    'businesses',
    businessId,
    'inventorySessions',
    sessionId,
    'counts',
  );
  const snap = await getDocs(countsRef);
  return snap.docs.map((d) => (d.data() || {}) as Record<string, unknown>);
}

export async function fetchFirstUserProfileDoc(params: {
  businessId: string;
  uid: string;
}): Promise<Record<string, unknown> | null> {
  const { businessId, uid } = params;
  const tryPaths = [
    ['businesses', businessId, 'users', uid],
    ['businesses', businessId, 'staff', uid],
    ['users', uid],
    ['profiles', uid],
  ];

  for (const parts of tryPaths) {
    try {
      const ref = doc(db, parts[0]!, ...parts.slice(1));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return (snap.data() || {}) as Record<string, unknown>;
      }
    } catch {
      // ignore lookup errors
    }
  }

  return null;
}

