import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';

export const assertTreasuryCashReconciliationWriteAccess = async ({
  authUid,
  businessId,
}) => {
  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.TREASURY_OPERATOR,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    requiredModule: 'cashReconciliation',
  });
};
