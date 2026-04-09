import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import { buildAccountingSettingsDerivedPlan } from '../utils/accountingConfigDerivedRecords.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export const syncAccountingSettingsDerivedRecords = onDocumentWritten(
  {
    document: 'businesses/{businessId}/settings/accounting',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId } = event.params;
    const beforeData = event.data?.before?.data() ?? null;
    const afterData = event.data?.after?.data() ?? null;

    const plan = buildAccountingSettingsDerivedPlan({
      businessId,
      beforeData,
      afterData,
    });
    if (!plan) {
      return null;
    }

    const batch = db.batch();
    const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);

    if (plan.historyEntry) {
      batch.set(
        settingsRef.collection('history').doc(plan.historyId),
        plan.historyEntry,
        { merge: true },
      );
    }

    if (plan.auditEntry) {
      batch.set(
        settingsRef.collection('audit').doc(plan.auditEntry.id),
        plan.auditEntry,
        { merge: true },
      );
    }

    plan.exchangeRateRecords.forEach((record) => {
      batch.set(
        db.doc(`businesses/${businessId}/exchangeRates/${record.id}`),
        record,
        { merge: true },
      );
    });

    plan.staleExchangeRateIds.forEach((exchangeRateId) => {
      batch.set(
        db.doc(`businesses/${businessId}/exchangeRates/${exchangeRateId}`),
        {
          status: 'superseded',
        },
        { merge: true },
      );
    });

    if (plan.shouldUpdateCurrentIds) {
      batch.set(
        settingsRef,
        {
          currentExchangeRateIdsByCurrency: plan.currentExchangeRateIdsByCurrency,
        },
        { merge: true },
      );
    }

    try {
      await batch.commit();
    } catch (error) {
      logger.error('Failed to sync derived accounting settings records', {
        businessId,
        error: error?.message || String(error),
      });
      throw error;
    }

    return null;
  },
);
