// @ts-nocheck
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { createReference, getDocFromRef } from '@/utils/refereceUtils';

export const convertFirestoreTimestamps = (dates, fields) => {
  fields.forEach((field) => {
    const timestamp = dates[field]?.seconds;
    if (timestamp) dates[field] = timestamp * 1000;
  });
};

export const subscribeToOrder = (businessID, filters, callback) => {
  const collectionRef = collection(db, 'businesses', businessID, 'orders');
  let q = collectionRef;

  if (filters) {
    const conditions = [];

    if (filters.status) {
      conditions.push(where('status', '==', filters.status));
    }
    if (filters.condition) {
      conditions.push(where('condition', '==', filters.condition));
    }
    if (filters.providerId) {
      conditions.push(where('provider', '==', filters.providerId));
    }

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }
  }

  return onSnapshot(q, callback);
};

export const getProvider = async (businessID, providerId) => {
  if (!providerId) return {};
  const providerRef = createReference(
    ['businesses', businessID, 'providers'],
    providerId,
  );
  const providerDoc = await getDocFromRef(providerRef);
  return providerDoc?.provider || {};
};

export const processOrder = async (data, businessID) => {
  const provider = await getProvider(businessID, data?.provider);
  return { ...data, provider };
};
