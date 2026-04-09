import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '@/firebase/firebaseconfig';

export type FirestoreDoc = { id: string; data: Record<string, unknown> };

export function listenCashCounts(params: {
  businessId: string;
  max?: number;
  onData: (docs: FirestoreDoc[]) => void;
  onError?: (error: unknown) => void;
}): Unsubscribe {
  const { businessId, max = 25, onData, onError } = params;
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  const noOp: Unsubscribe = () => {};
  if (!businessId || !onData) return noOp;

  const ref = collection(db, 'businesses', businessId, 'cashCounts');
  const q = query(ref, orderBy('cashCount.createdAt', 'desc'), limit(max));

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

export function listenBusinesses(params: {
  max?: number;
  onData: (docs: FirestoreDoc[]) => void;
  onError?: (error: unknown) => void;
}): Unsubscribe {
  const { max = 100, onData, onError } = params;
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  const noOp: Unsubscribe = () => {};
  if (!onData) return noOp;

  const ref = collection(db, 'businesses');
  const q = query(ref, limit(max));

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

export async function fetchUsers(max = 500): Promise<FirestoreDoc[]> {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(query(usersRef, limit(max)));
  return snap.docs.map((d) => ({
    id: d.id,
    data: (d.data() || {}) as Record<string, unknown>,
  }));
}

export async function fetchCashCountDoc(params: {
  businessId: string;
  cashCountId: string;
}): Promise<Record<string, unknown> | null> {
  const { businessId, cashCountId } = params;
  const ccRef = doc(db, 'businesses', businessId, 'cashCounts', cashCountId);
  const ccSnap = await getDoc(ccRef);
  if (!ccSnap.exists()) return null;
  return (ccSnap.data() || {}) as Record<string, unknown>;
}

export async function fetchInvoicesByCashCountId(params: {
  businessId: string;
  cashCountId: string;
}): Promise<Array<Record<string, unknown>>> {
  const { businessId, cashCountId } = params;
  const snap = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'invoices'),
      where('data.cashCountId', '==', cashCountId),
    ),
  );
  return snap.docs.map((d) => (d.data() || {}) as Record<string, unknown>);
}

export async function fetchExpensesByCashCountId(params: {
  businessId: string;
  cashCountId: string;
}): Promise<Array<Record<string, unknown>>> {
  const { businessId, cashCountId } = params;
  const snap = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'expenses'),
      where('expense.payment.cashRegister', '==', cashCountId),
    ),
  );
  return snap.docs.map((d) => (d.data() || {}) as Record<string, unknown>);
}

export async function fetchAccountsReceivablePaymentsByCashierAndRange(params: {
  businessId: string;
  cashierId: string;
  startMillis: number;
  endMillis: number;
}): Promise<Array<Record<string, unknown>>> {
  const { businessId, cashierId, startMillis, endMillis } = params;

  const snap = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'accountsReceivablePayments'),
      where('createdUserId', '==', cashierId),
      where('createdAt', '>=', Timestamp.fromMillis(startMillis)),
      where('createdAt', '<=', Timestamp.fromMillis(endMillis)),
    ),
  );

  return snap.docs.map((d) => (d.data() || {}) as Record<string, unknown>);
}

export async function runCashCountAudit(params: {
  businessId: string;
  allBusinesses: boolean;
  from: number | null;
  to: number | null;
  threshold: number;
}): Promise<unknown> {
  const callable = httpsCallable(functions, 'runCashCountAudit');
  const { data } = await callable(params);
  return data;
}

