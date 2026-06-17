import type { UserIdentity, UserRoleLike } from '@/types/users';
import { toCleanString } from '@/utils/text';

export const resolveUserIdentityUid = (
  user: UserIdentity | null | undefined,
): string | null =>
  toCleanString(user?.uid) ||
  toCleanString(user?.id) ||
  null;

export const resolveUserIdentityBusinessId = (
  user: UserIdentity | null | undefined,
): string | null =>
  toCleanString(user?.activeBusinessId) ||
  toCleanString(user?.businessId) ||
  toCleanString(user?.businessID) ||
  null;

export const resolveUserIdentityRole = (
  user: UserIdentity | null | undefined,
): UserRoleLike | null =>
  (toCleanString(user?.activeRole) as UserRoleLike | null) ||
  (toCleanString(user?.role) as UserRoleLike | null) ||
  null;

