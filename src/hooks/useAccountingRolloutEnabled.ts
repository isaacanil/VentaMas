import { isAccountingRolloutEnabledForBusiness } from '@/utils/accounting/monetary';

import {
  toCleanBusinessId,
  useAccountingSettingsSnapshot,
  type AccountingSettingsSnapshotState,
} from './useAccountingSettingsSnapshot';

export interface RolloutAvailabilityState {
  enabled: boolean;
  resolved: boolean;
}

export const resolveAccountingRolloutAvailability = (
  businessId: string | null | undefined,
  settingsSnapshot: AccountingSettingsSnapshotState,
): RolloutAvailabilityState => {
  const normalizedBusinessId = toCleanBusinessId(businessId);
  const fallbackEnabled = isAccountingRolloutEnabledForBusiness(
    normalizedBusinessId,
  );

  if (!normalizedBusinessId || settingsSnapshot.status === 'disabled') {
    return {
      enabled: false,
      resolved: true,
    };
  }

  if (settingsSnapshot.status === 'ready') {
    return {
      enabled: isAccountingRolloutEnabledForBusiness(
        normalizedBusinessId,
        settingsSnapshot.data,
      ),
      resolved: true,
    };
  }

  if (settingsSnapshot.status === 'error') {
    return {
      enabled: fallbackEnabled,
      resolved: true,
    };
  }

  return {
    enabled: fallbackEnabled,
    resolved: fallbackEnabled,
  };
};

export const useAccountingRolloutAvailability = (
  businessId: string | null | undefined,
  isEnabled = true,
): RolloutAvailabilityState => {
  const normalizedBusinessId = toCleanBusinessId(businessId);
  const settingsSnapshot = useAccountingSettingsSnapshot(
    normalizedBusinessId,
    isEnabled,
  );

  if (!isEnabled || !normalizedBusinessId) {
    return {
      enabled: false,
      resolved: true,
    };
  }

  return resolveAccountingRolloutAvailability(
    normalizedBusinessId,
    settingsSnapshot,
  );
};

export const useAccountingRolloutEnabled = (
  businessId: string | null | undefined,
  isEnabled = true,
): boolean =>
  useAccountingRolloutAvailability(businessId, isEnabled).enabled;
