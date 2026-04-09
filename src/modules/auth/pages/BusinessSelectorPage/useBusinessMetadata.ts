import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { AvailableBusinessContext } from '@/utils/auth-adapter';

export interface BusinessMetadata {
  name: string | null;
  subscriptionStatus: string | null;
  subscriptionPlanId: string | null;
  ownerUid: string | null;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const resolveMetadataFromSnapshot = (
  snapshotData: unknown,
): BusinessMetadata => {
  const root = asRecord(snapshotData);
  const businessNode = asRecord(root.business);
  const nestedBusinessNode = asRecord(businessNode.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(businessNode.subscription);

  return {
    name:
      toCleanString(root.name) ||
      toCleanString(businessNode.name) ||
      toCleanString(nestedBusinessNode.name) ||
      null,
    subscriptionStatus:
      toCleanString(rootSubscription.status)?.toLowerCase() ||
      toCleanString(nestedSubscription.status)?.toLowerCase() ||
      null,
    subscriptionPlanId:
      toCleanString(rootSubscription.planId) ||
      toCleanString(nestedSubscription.planId) ||
      null,
    ownerUid:
      toCleanString(root.ownerUid) ||
      toCleanString(businessNode.ownerUid) ||
      toCleanString(nestedBusinessNode.ownerUid) ||
      null,
  };
};

export const useBusinessMetadata = (
  businesses: AvailableBusinessContext[],
): Map<string, BusinessMetadata> => {
  const [metadataMap, setMetadataMap] = useState<Map<string, BusinessMetadata>>(
    new Map(),
  );
  const businessIdsKey = useMemo(
    () => businesses.map((business) => business.businessId).sort().join(','),
    [businesses],
  );
  const businessIds = useMemo(
    () => (businessIdsKey ? businessIdsKey.split(',') : []),
    [businessIdsKey],
  );

  useEffect(() => {
    if (!businessIds.length) {
      setMetadataMap(new Map());
      return;
    }

    let cancelled = false;

    const fetchMetadata = async () => {
      const next = new Map<string, BusinessMetadata>();

      await Promise.all(
        businessIds.map(async (businessId) => {
          try {
            const businessRef = doc(db, 'businesses', businessId);
            const snapshot = await getDoc(businessRef);
            if (!snapshot.exists()) return;

            next.set(
              businessId,
              resolveMetadataFromSnapshot(snapshot.data()),
            );
          } catch {
            // Ignore individual lookup errors to keep selector usable.
          }
        }),
      );

      if (!cancelled) {
        setMetadataMap(next);
      }
    };

    void fetchMetadata();

    return () => {
      cancelled = true;
    };
  }, [businessIds]);

  if (!businessIds.length) {
    return new Map();
  }

  return metadataMap;
};

export default useBusinessMetadata;
