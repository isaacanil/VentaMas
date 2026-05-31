import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import type { MissingBusiness, ScanProgress } from '../types';
import {
  isMissingNestedCreatedAt,
  normalizeBusinessMissingCreatedAt,
} from '../utils/businessMissingCreatedAtData';

const BUSINESS_COLLECTION = 'businesses';
const SCAN_PROGRESS_STEP = 50;
const WRITE_BATCH_SIZE = 400;

export const FIXED_CREATED_AT_ISO = '2024-01-01T00:00:00.000Z';

interface ScanBusinessesMissingCreatedAtOptions {
  onProgress?: (progress: ScanProgress) => void;
  shouldAbort?: () => boolean;
}

interface ScanBusinessesMissingCreatedAtResult {
  missing: MissingBusiness[];
  progress: ScanProgress;
}

interface FixCreatedAtOptions {
  useFixedDate: boolean;
}

export const scanBusinessesMissingCreatedAt = async ({
  onProgress,
  shouldAbort,
}: ScanBusinessesMissingCreatedAtOptions = {}): Promise<ScanBusinessesMissingCreatedAtResult> => {
  const snapshot = await getDocs(collection(db, BUSINESS_COLLECTION));
  const total = snapshot.size;
  const missing: MissingBusiness[] = [];
  let scanned = 0;

  onProgress?.({ scanned, total });

  snapshot.forEach((documentSnapshot) => {
    if (shouldAbort?.()) return;

    const data = (documentSnapshot.data() || {}) as Record<string, unknown>;
    const business = normalizeBusinessMissingCreatedAt(
      documentSnapshot.id,
      data,
    );

    if (isMissingNestedCreatedAt(business)) {
      missing.push(business);
    }

    scanned += 1;
    if (scanned % SCAN_PROGRESS_STEP === 0) {
      onProgress?.({ scanned, total });
    }
  });

  const progress = { scanned, total };
  onProgress?.(progress);

  return { missing, progress };
};

export const fixBusinessCreatedAt = async (
  business: MissingBusiness,
  options: FixCreatedAtOptions,
) => {
  await updateDoc(doc(db, BUSINESS_COLLECTION, business.id), {
    'business.createdAt': resolveCreatedAtValue(business, options),
  });
};

export const fixMissingBusinessesCreatedAt = async (
  missing: MissingBusiness[],
  options: FixCreatedAtOptions,
) => {
  for (let index = 0; index < missing.length; index += WRITE_BATCH_SIZE) {
    const batch = writeBatch(db);
    const slice = missing.slice(index, index + WRITE_BATCH_SIZE);

    slice.forEach((business) => {
      batch.update(doc(db, BUSINESS_COLLECTION, business.id), {
        'business.createdAt': resolveCreatedAtValue(business, options),
      });
    });

    await batch.commit();
  }
};

const resolveCreatedAtValue = (
  business: MissingBusiness,
  { useFixedDate }: FixCreatedAtOptions,
) => {
  if (business.hasCreatedAtRoot && business.raw.createdAt) {
    return business.raw.createdAt;
  }
  if (useFixedDate) {
    return new Date(FIXED_CREATED_AT_ISO);
  }
  return serverTimestamp();
};
