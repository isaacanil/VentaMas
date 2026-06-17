import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';
import {
  resolveActiveBusinessId,
  type BusinessFeatureKey,
} from '@/utils/businessFeatures';
import { toCleanString } from '@/utils/text';

import {
  resolveAccountingRolloutAvailability,
  type RolloutAvailabilityState,
} from './useAccountingRolloutEnabled';
import { useAccountingSettingsSnapshot } from './useAccountingSettingsSnapshot';

const readTreasuryFeatureState = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return true;
  }

  const record = value as Record<string, unknown>;
  return record.treasuryEnabled !== false;
};

const useTreasuryFeatureAvailability = (
  businessId: string | null,
  accountingSettingsSnapshot: ReturnType<typeof useAccountingSettingsSnapshot>,
): { enabled: boolean; resolved: boolean } => {
  if (!businessId || accountingSettingsSnapshot.status === 'disabled') {
    return {
      enabled: false,
      resolved: true,
    };
  }

  if (accountingSettingsSnapshot.status === 'ready') {
    return {
      enabled: readTreasuryFeatureState(accountingSettingsSnapshot.data),
      resolved: true,
    };
  }

  if (accountingSettingsSnapshot.status === 'error') {
    return {
      enabled: true,
      resolved: true,
    };
  }

  return {
    enabled: true,
    resolved: false,
  };
};

const useBusinessFeatureStates = (
  businessId?: string | null,
): {
  accounting: RolloutAvailabilityState;
  treasury: { enabled: boolean; resolved: boolean };
} => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const resolvedBusinessId =
    toCleanString(businessId) ?? resolveActiveBusinessId(user);
  const accountingSettingsSnapshot = useAccountingSettingsSnapshot(
    resolvedBusinessId,
    true,
  );
  const accounting = resolveAccountingRolloutAvailability(
    resolvedBusinessId,
    accountingSettingsSnapshot,
  );
  const treasury = useTreasuryFeatureAvailability(
    resolvedBusinessId,
    accountingSettingsSnapshot,
  );

  return { accounting, treasury };
};

export const useBusinessFeatureEnabled = (
  feature: BusinessFeatureKey,
  businessId?: string | null,
): boolean => {
  const featureStates = useBusinessFeatureStates(businessId);

  switch (feature) {
    case 'accounting':
      return featureStates.accounting.enabled;
    case 'treasury':
      return featureStates.treasury.enabled;
    default:
      return false;
  }
};

export const useBusinessFeatureAvailability = (
  feature: BusinessFeatureKey,
  businessId?: string | null,
): { enabled: boolean; resolved: boolean } => {
  const featureStates = useBusinessFeatureStates(businessId);

  switch (feature) {
    case 'accounting':
      return featureStates.accounting;
    case 'treasury':
      return featureStates.treasury;
    default:
      return { enabled: false, resolved: true };
  }
};

export default useBusinessFeatureEnabled;
