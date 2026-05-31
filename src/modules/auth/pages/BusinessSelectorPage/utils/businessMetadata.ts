import type { BusinessMetadata } from '../types';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const resolveBusinessMetadataFromSnapshot = (
  snapshotData: unknown,
): BusinessMetadata => {
  const root = asRecord(snapshotData);
  const businessNode = asRecord(root.business);
  const nestedBusinessNode = asRecord(businessNode.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(businessNode.subscription);

  return {
    name:
      toCleanString(root.name) ||
      toCleanString(businessNode.name) ||
      toCleanString(nestedBusinessNode.name) ||
      null,
    subscriptionStatus:
      toCleanString(rootSubscription.status)?.toLowerCase() ||
      toCleanString(nestedSubscription.status)?.toLowerCase() ||
      null,
    subscriptionPlanId:
      toCleanString(rootSubscription.planId) ||
      toCleanString(nestedSubscription.planId) ||
      null,
    ownerUid:
      toCleanString(root.ownerUid) ||
      toCleanString(businessNode.ownerUid) ||
      toCleanString(nestedBusinessNode.ownerUid) ||
      null,
  };
};
