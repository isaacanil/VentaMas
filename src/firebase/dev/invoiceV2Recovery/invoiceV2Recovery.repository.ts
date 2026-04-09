import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query as buildQuery,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export async function fetchCanonicalInvoicesForSuggestions(params: {
  businessId: string;
  max: number;
}): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const { businessId, max } = params;
  const canonicalRef = collection(db, 'businesses', businessId, 'invoices');
  const canonicalSnap = await getDocs(buildQuery(canonicalRef, limit(max)));
  return canonicalSnap.docs.map((d) => ({
    id: d.id,
    data: (d.data() || {}) as Record<string, unknown>,
  }));
}

export async function fetchInvoiceV2ForSuggestions(params: {
  businessId: string;
  max: number;
}): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const { businessId, max } = params;
  const v2Ref = collection(db, 'businesses', businessId, 'invoicesV2');
  const v2Snap = await getDocs(
    buildQuery(v2Ref, orderBy('createdAt', 'desc'), limit(max)),
  );
  return v2Snap.docs.map((d) => ({
    id: d.id,
    data: (d.data() || {}) as Record<string, unknown>,
  }));
}

export async function fetchInvoiceCounter(params: {
  businessId: string;
}): Promise<{ value: unknown; updatedAt: unknown } | null> {
  const { businessId } = params;
  const counterRef = doc(
    db,
    'businesses',
    businessId,
    'counters',
    'lastInvoiceId',
  );
  const counterSnap = await getDoc(counterRef);
  if (!counterSnap.exists()) return null;
  const data = (counterSnap.data() || {}) as Record<string, unknown>;
  return { value: data.value, updatedAt: data.updatedAt ?? data.updated_at };
}

export async function setInvoiceCounter(params: {
  businessId: string;
  value: number;
}): Promise<void> {
  const { businessId, value } = params;
  const counterRef = doc(
    db,
    'businesses',
    businessId,
    'counters',
    'lastInvoiceId',
  );
  await setDoc(
    counterRef,
    {
      value,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateInvoiceNumberDocs(params: {
  businessId: string;
  invoiceId: string;
  updateCanonical: boolean;
  canonicalUpdates: Record<string, unknown>;
  v2Updates: Record<string, unknown>;
}): Promise<void> {
  const { businessId, invoiceId, updateCanonical, canonicalUpdates, v2Updates } =
    params;

  const canonicalRef = doc(db, 'businesses', businessId, 'invoices', invoiceId);
  const v2Ref = doc(db, 'businesses', businessId, 'invoicesV2', invoiceId);

  const writes: Array<Promise<unknown>> = [];
  if (updateCanonical) {
    writes.push(updateDoc(canonicalRef, canonicalUpdates));
  }
  writes.push(updateDoc(v2Ref, v2Updates));

  await Promise.all(writes);
}

