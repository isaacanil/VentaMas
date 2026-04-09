import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export async function fetchProducts(params: {
  businessId: string;
}): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const { businessId } = params;
  const ref = collection(db, 'businesses', businessId, 'products');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, data: (d.data() || {}) as Record<string, unknown> }));
}

export async function fetchBatches(params: {
  businessId: string;
}): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const { businessId } = params;
  const ref = collection(db, 'businesses', businessId, 'batches');
  const qref = query(ref, where('isDeleted', '==', false));
  const snap = await getDocs(qref);
  return snap.docs.map((d) => ({ id: d.id, data: (d.data() || {}) as Record<string, unknown> }));
}

export async function fetchProductsStock(params: {
  businessId: string;
}): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const { businessId } = params;
  const ref = collection(db, 'businesses', businessId, 'productsStock');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, data: (d.data() || {}) as Record<string, unknown> }));
}

