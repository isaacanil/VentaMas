import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { getNextIDTransactionalSnap } from '../../../core/utils/getNextID.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import { addAccountReceivable } from '../services/addAccountReceivable.js';
import { addInstallmentReceivable } from '../services/addInstallmentsAccountReceivable.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const createAccountsReceivable = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const accountsReceivable = asRecord(
    payload.accountsReceivable || payload.ar,
  );

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!Object.keys(accountsReceivable).length) {
    throw new HttpsError(
      'invalid-argument',
      'accountsReceivable es requerido',
    );
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    requiredModule: 'accountsReceivable',
  });

  const user = { uid: authUid, businessID: businessId };
  let arRecord = null;

  await db.runTransaction(async (tx) => {
    const accountReceivableNextIDSnap = await getNextIDTransactionalSnap(
      tx,
      user,
      'lastAccountReceivableId',
    );

    arRecord = await addAccountReceivable(tx, {
      user,
      ar: accountsReceivable,
      accountReceivableNextIDSnap,
    });
    await addInstallmentReceivable(tx, { user, ar: arRecord });
  });

  return {
    ok: true,
    businessId,
    accountsReceivable: {
      ...arRecord,
      installmentsCreatedInBackend: true,
    },
  };
});
