import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { runAccountingEventProjection } from '../../../versions/v2/accounting/accountingEventProjection.service.js';
import { buildPurchaseCommittedAccountingEvent } from './purchaseAccountingEvent.shared.js';
import { asRecord } from './payablePayments.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export { buildPurchaseCommittedAccountingEvent };

export const syncPurchaseCommittedAccountingEvent = onDocumentWritten(
  {
    document: 'businesses/{businessId}/purchases/{purchaseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, purchaseId } = event.params;
    const beforePurchase = asRecord(event.data?.before?.data());
    const afterPurchase = asRecord(event.data?.after?.data());

    const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);
    const settingsSnap = await settingsRef.get();
    const rawSettings = settingsSnap.exists ? settingsSnap.data() || {} : {};
    const accountingSettings = await getPilotAccountingSettingsForBusiness(
      businessId,
      { settings: rawSettings },
    );
    if (
      !accountingSettings ||
      rawSettings.generalAccountingEnabled !== true ||
      !isAccountingRolloutEnabledForBusiness(businessId, rawSettings)
    ) {
      return null;
    }

    const accountingEvent = buildPurchaseCommittedAccountingEvent({
      afterPurchase,
      beforePurchase,
      businessId,
      purchaseId,
    });

    if (!accountingEvent) {
      return null;
    }

    await db
      .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
      .set(accountingEvent, { merge: true });
    if (accountingEvent.status === 'voided') {
      await runAccountingEventProjection({
        businessId,
        eventId: accountingEvent.id,
        accountingEvent,
      });
    }

    return null;
  },
);
