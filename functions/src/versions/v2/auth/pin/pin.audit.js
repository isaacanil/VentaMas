import { logger } from 'firebase-functions';

import { Timestamp, db } from '../../../../core/config/firebase.js';

export const logPinAction = async ({ businessID, actor, targetUserId, targetUser, action, reason, module, modules }) => {
  if (!businessID) return;
  try {
    const logsRef = db.collection('businesses').doc(businessID).collection('pinAuthLogs');
    await logsRef.add({
      action,
      reason: reason || null,
      module: module || null,
      modules: modules || null,
      targetUserId: targetUserId || null,
      targetUserName: targetUser?.displayName || targetUser?.name || null,
      performedBy: actor,
      timestamp: Timestamp.now(),
      businessID,
    });
  } catch (error) {
    logger.error('[pinAuth] Failed to write audit log', { error });
  }
};
