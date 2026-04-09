import { useSelector } from 'react-redux';

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

export const useBusinessFeatureEnabled = (
  feature: BusinessFeatureKey,
  businessId?: string | null,
): boolean => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const resolvedBusinessId =
    toCleanString(businessId) ?? resolveActiveBusinessId(user);

  const accountingEnabled = useAccountingRolloutEnabled(
    resolvedBusinessId,
    feature === 'accounting',
  );

  switch (feature) {
    case 'accounting':
      return accountingEnabled;
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
    feature === 'accounting',
  );

  switch (feature) {
    case 'accounting':
      return accountingAvailability;
    default:
      return { enabled: false, resolved: true };
  }
};

export default useBusinessFeatureEnabled;
