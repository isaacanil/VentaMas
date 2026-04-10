import type { UserIdentity } from '@/types/users';

export type BusinessFeatureKey = 'accounting' | 'treasury';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const resolveActiveBusinessId = (
  user: UserIdentity | null | undefined,
): string | null =>
  toCleanString(user?.activeBusinessId) ??
  toCleanString(user?.businessID) ??
  toCleanString(user?.businessId) ??
  null;
