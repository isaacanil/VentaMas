import { doc, onSnapshot } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { selectUser } from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';
import {
  resolveActiveBusinessId,
  type BusinessFeatureKey,
} from '@/utils/businessFeatures';

import {
  useAccountingRolloutAvailability,
  useAccountingRolloutEnabled,
} from './useAccountingRolloutEnabled';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readTreasuryFeatureState = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return true;
  }

  const record = value as Record<string, unknown>;
  return record.treasuryEnabled !== false;
};

const useTreasuryFeatureAvailability = (
  businessId: string | null,
  isEnabled = true,
): { enabled: boolean; resolved: boolean } => {
  const [snapshotState, setSnapshotState] = useState<{
    businessId: string;
    enabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isEnabled || !businessId) {
      return undefined;
    }

    const settingsRef = doc(db, 'businesses', businessId, 'settings', 'accounting');

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        setSnapshotState({
          businessId,
          enabled: snapshot.exists()
            ? readTreasuryFeatureState(snapshot.data())
            : true,
        });
      },
      () => {
        setSnapshotState({
          businessId,
          enabled: true,
        });
      },
    );

    return unsubscribe;
  }, [businessId, isEnabled]);

  if (!isEnabled || !businessId) {
    return {
      enabled: false,
      resolved: true,
    };
  }

  if (snapshotState?.businessId === businessId) {
    return {
      enabled: snapshotState.enabled,
      resolved: true,
    };
  }

  return {
    enabled: true,
    resolved: false,
  };
};

export const useBusinessFeatureEnabled = (
  feature: BusinessFeatureKey,
  businessId?: string | null,
): boolean => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const resolvedBusinessId =
    toCleanString(businessId) ?? resolveActiveBusinessId(user);

  const accountingEnabled = useAccountingRolloutEnabled(
    resolvedBusinessId,
    true,
  );
  const treasuryAvailability = useTreasuryFeatureAvailability(
    resolvedBusinessId,
    true,
  );

  switch (feature) {
    case 'accounting':
      return accountingEnabled;
    case 'treasury':
      return treasuryAvailability.enabled;
    default:
      return false;
  }
};

export const useBusinessFeatureAvailability = (
  feature: BusinessFeatureKey,
  businessId?: string | null,
): { enabled: boolean; resolved: boolean } => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const resolvedBusinessId =
    toCleanString(businessId) ?? resolveActiveBusinessId(user);

  const accountingAvailability = useAccountingRolloutAvailability(
    resolvedBusinessId,
    true,
  );
  const treasuryAvailability = useTreasuryFeatureAvailability(
    resolvedBusinessId,
    true,
  );

  switch (feature) {
    case 'accounting':
      return accountingAvailability;
    case 'treasury':
      return treasuryAvailability;
    default:
      return { enabled: false, resolved: true };
  }
};

export default useBusinessFeatureEnabled;
