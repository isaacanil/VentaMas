import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { isAccountingRolloutEnabledForBusiness } from '@/utils/accounting/monetary';

interface RolloutSnapshotState {
  businessId: string;
  enabled: boolean;
}

export interface RolloutAvailabilityState {
  enabled: boolean;
  resolved: boolean;
}

const toCleanBusinessId = (
  businessId: string | null | undefined,
): string | null => {
  if (typeof businessId !== 'string') return null;
  const trimmed = businessId.trim();
  return trimmed.length ? trimmed : null;
};

export const useAccountingRolloutAvailability = (
  businessId: string | null | undefined,
  isEnabled = true,
): RolloutAvailabilityState => {
  const normalizedBusinessId = toCleanBusinessId(businessId);
  const fallbackEnabled = isAccountingRolloutEnabledForBusiness(
    normalizedBusinessId,
  );
  const [snapshotState, setSnapshotState] = useState<RolloutSnapshotState | null>(
    null,
  );

  useEffect(() => {
    if (!isEnabled || !normalizedBusinessId) {
      return undefined;
    }

    const settingsRef = doc(
      db,
      'businesses',
      normalizedBusinessId,
      'settings',
      'accounting',
    );

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        setSnapshotState({
          businessId: normalizedBusinessId,
          enabled: isAccountingRolloutEnabledForBusiness(
            normalizedBusinessId,
            snapshot.exists() ? snapshot.data() : null,
          ),
        });
      },
      () => {
        setSnapshotState({
          businessId: normalizedBusinessId,
          enabled: fallbackEnabled,
        });
      },
    );

    return unsubscribe;
  }, [fallbackEnabled, isEnabled, normalizedBusinessId]);

  if (!isEnabled || !normalizedBusinessId) {
    return {
      enabled: false,
      resolved: true,
    };
  }

  if (snapshotState?.businessId === normalizedBusinessId) {
    return {
      enabled: snapshotState.enabled,
      resolved: true,
    };
  }

  return {
    enabled: fallbackEnabled,
    resolved: fallbackEnabled,
  };
};

export const useAccountingRolloutEnabled = (
  businessId: string | null | undefined,
  isEnabled = true,
): boolean =>
  useAccountingRolloutAvailability(businessId, isEnabled).enabled;
