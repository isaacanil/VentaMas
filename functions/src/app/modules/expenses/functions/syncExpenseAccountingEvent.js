import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildExpenseRecordedAccountingEvent,
} from './expenseAccountingEvent.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export { buildExpenseRecordedAccountingEvent };

export const syncExpenseAccountingEvent = onDocumentWritten(
  {
    document: 'businesses/{businessId}/expenses/{expenseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, expenseId } = event.params;
    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    if (
      !isAccountingRolloutEnabledForBusiness(businessId, accountingSettings) ||
      accountingSettings?.generalAccountingEnabled === false
    ) {
      return null;
    }

    const beforeRecord = event.data?.before?.data() ?? null;
    const afterRecord = event.data?.after?.data() ?? null;
    const accountingEvent = buildExpenseRecordedAccountingEvent({
      businessId,
      expenseId,
      beforeExpense: beforeRecord?.expense ?? beforeRecord,
      afterExpense: afterRecord?.expense ?? afterRecord,
    });

    if (!accountingEvent) {
      return null;
    }

    await db
      .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
      .set(accountingEvent, { merge: true });

    return null;
  },
);
