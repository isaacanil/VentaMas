import { asRecord } from '@/utils/object/record';
import { toCleanString } from '@/utils/text';

export interface BusinessMetadata {
  name: string | null;
  subscriptionStatus: string | null;
  subscriptionPlanId: string | null;
  ownerUid: string | null;
}

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
