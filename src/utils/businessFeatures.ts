import type { UserIdentity } from '@/types/users';
import { toCleanString } from '@/utils/text';

export type BusinessFeatureKey = 'accounting' | 'treasury';

export const resolveActiveBusinessId = (
  user: UserIdentity | null | undefined,
): string | null =>
  toCleanString(user?.activeBusinessId) ??
  toCleanString(user?.businessID) ??
  toCleanString(user?.businessId) ??
  null;
