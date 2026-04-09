import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import { isAccountingRolloutEnabledForBusiness } from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildExpenseCashMovement,
  buildExpenseCashMovementId,
} from '../../../versions/v2/accounting/utils/cashMovement.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export const syncExpenseCashMovement = onDocumentWritten(
  {
    document: 'businesses/{businessId}/expenses/{expenseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, expenseId } = event.params;
    if (!isAccountingRolloutEnabledForBusiness(businessId)) {
      return null;
    }

    const beforeExpense = event.data?.before?.data()?.expense ?? null;
    const afterExpense = event.data?.after?.data()?.expense ?? null;
    const movementId = buildExpenseCashMovementId(expenseId);
    const movementRef = db.doc(`businesses/${businessId}/cashMovements/${movementId}`);

    if (!afterExpense) {
      if (beforeExpense) {
        await movementRef.delete().catch((error) => {
          logger.warn('Failed to delete expense cash movement after document removal', {
            businessId,
            expenseId,
            movementId,
            error: error?.message || String(error),
          });
        });
      }
      return null;
    }

    const movement = buildExpenseCashMovement({
      businessId,
      expenseId,
      expense: afterExpense,
      createdAt:
        afterExpense?.dates?.createdAt ??
        afterExpense?.createdAt ??
        afterExpense?.dates?.expenseDate ??
        null,
      createdBy: afterExpense?.createdBy ?? null,
    });

    if (!movement) {
      if (beforeExpense) {
        await movementRef.delete().catch((error) => {
          logger.warn('Failed to delete stale expense cash movement', {
            businessId,
            expenseId,
            movementId,
            error: error?.message || String(error),
          });
        });
      }
      return null;
    }

    await movementRef.set(movement, { merge: true });
    return null;
  },
);
