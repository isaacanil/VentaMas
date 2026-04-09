import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import { buildEntityDerivedPlan } from '../utils/accountingConfigDerivedRecords.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export const syncAccountingPostingProfilesDerivedHistory = onDocumentWritten(
  {
    document: 'businesses/{businessId}/accountingPostingProfiles/{postingProfileId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, postingProfileId } = event.params;
    const plan = buildEntityDerivedPlan({
      scope: 'posting_profile',
      businessId,
      entityId: postingProfileId,
      beforeData: event.data?.before?.data() ?? null,
      afterData: event.data?.after?.data() ?? null,
    });
    if (!plan) {
      return null;
    }

    const batch = db.batch();
    const postingProfileRef = db.doc(
      `businesses/${businessId}/accountingPostingProfiles/${postingProfileId}`,
    );
    const auditRef = db.doc(
      `businesses/${businessId}/settings/accounting/audit/${plan.auditEntry.id}`,
    );

    batch.set(
      postingProfileRef.collection('history').doc(plan.historyId),
      plan.historyEntry,
      { merge: true },
    );
    batch.set(auditRef, plan.auditEntry, { merge: true });

    try {
      await batch.commit();
    } catch (error) {
      logger.error('Failed to sync accounting posting profile derived history', {
        businessId,
        postingProfileId,
        error: error?.message || String(error),
      });
      throw error;
    }

    return null;
  },
);
