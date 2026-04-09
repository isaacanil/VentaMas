import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import { buildEntityDerivedPlan } from '../utils/accountingConfigDerivedRecords.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export const syncChartOfAccountsDerivedHistory = onDocumentWritten(
  {
    document: 'businesses/{businessId}/chartOfAccounts/{chartOfAccountId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, chartOfAccountId } = event.params;
    const plan = buildEntityDerivedPlan({
      scope: 'chart_of_account',
      businessId,
      entityId: chartOfAccountId,
      beforeData: event.data?.before?.data() ?? null,
      afterData: event.data?.after?.data() ?? null,
    });
    if (!plan) {
      return null;
    }

    const batch = db.batch();
    const chartOfAccountRef = db.doc(
      `businesses/${businessId}/chartOfAccounts/${chartOfAccountId}`,
    );
    const auditRef = db.doc(
      `businesses/${businessId}/settings/accounting/audit/${plan.auditEntry.id}`,
    );

    batch.set(
      chartOfAccountRef.collection('history').doc(plan.historyId),
      plan.historyEntry,
      { merge: true },
    );
    batch.set(auditRef, plan.auditEntry, { merge: true });

    try {
      await batch.commit();
    } catch (error) {
      logger.error('Failed to sync chart of accounts derived history', {
        businessId,
        chartOfAccountId,
        error: error?.message || String(error),
      });
      throw error;
    }

    return null;
  },
);
