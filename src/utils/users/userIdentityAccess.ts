import type { UserIdentity, UserRoleLike } from '@/types/users';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

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

