import { toCleanString } from '@/utils/text';

import { canBaseAbility } from './baseAbility';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const canAction = (user: unknown, action: string): boolean => {
  return canBaseAbility(user, action, 'all');
};

export const isBusinessAccountOwner = (
  user: unknown,
  business: unknown,
): boolean => {
  const userRecord = asRecord(user);
  const businessRoot = asRecord(business);
  const businessNode = asRecord(businessRoot.business);
  const nestedBusinessNode = asRecord(businessNode.business);

  const authUid =
    toCleanString(userRecord.uid) || toCleanString(userRecord.id) || null;
  const ownerUid =
    toCleanString(businessRoot.ownerUid) ||
    toCleanString(businessNode.ownerUid) ||
    toCleanString(nestedBusinessNode.ownerUid) ||
    null;
  const activeRole =
    toCleanString(userRecord.activeBusinessRole) ||
    toCleanString(userRecord.activeRole) ||
    toCleanString(userRecord.role);

  return Boolean(
    (authUid && ownerUid && authUid === ownerUid) || activeRole === 'owner',
  );
};

export const hasBillingAccountManageAccess = ({
  user,
  business,
}: {
  user: unknown;
  business: unknown;
}): boolean => {
  return (
    canAction(user, 'billingAccountManage') || isBusinessAccountOwner(user, business)
  );
};

export const hasBusinessCreateUnderAccountQuotaAccess = ({
  user,
  hasBusinesses,
  hasOwnedBusinessLink,
}: {
  user: unknown;
  hasBusinesses: boolean;
  hasOwnedBusinessLink: boolean;
}): boolean => {
  if (!hasBusinesses) return true;
  if (hasOwnedBusinessLink) return true;
  return canAction(user, 'businessCreateUnderAccountQuota');
};
