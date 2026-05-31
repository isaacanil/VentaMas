import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import type { BusinessMetadata } from '../types';
import { resolveBusinessMetadataFromSnapshot } from '../utils/businessMetadata';

const BUSINESSES_COLLECTION = 'businesses';

export const fetchBusinessMetadataMap = async (
  businessIds: string[],
): Promise<Map<string, BusinessMetadata>> => {
  const next = new Map<string, BusinessMetadata>();

  await Promise.all(
    businessIds.map(async (businessId) => {
      try {
        const snapshot = await getDoc(
          doc(db, BUSINESSES_COLLECTION, businessId),
        );
        if (!snapshot.exists()) return;

        next.set(
          businessId,
          resolveBusinessMetadataFromSnapshot(snapshot.data()),
        );
      } catch {
        // Ignore individual lookup errors to keep selector usable.
      }
    }),
  );

  return next;
};
