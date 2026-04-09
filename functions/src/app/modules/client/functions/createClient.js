import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { getNextIDTransactional } from '../../../core/utils/getNextID.js';
import { buildClientWritePayload } from '../utils/clientNormalizer.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import {
  assertBusinessSubscriptionAccess,
} from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toSerializableClient = (client) => {
  if (!client || typeof client !== 'object') return null;
  const next = { ...client };
  delete next.createdAt;
  delete next.updatedAt;
  delete next.deletedAt;
  return next;
};

export const createClient = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const clientInput = asRecord(payload.client);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    toCleanString(clientInput.businessID) ||
    null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!Object.keys(clientInput).length) {
    throw new HttpsError('invalid-argument', 'client es requerido');
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.CLIENT_CREATE,
  });

  const user = { uid: authUid, businessID: businessId };
  const clientId = toCleanString(clientInput.id) || nanoid(8);
  let normalizedClient = null;

  await db.runTransaction(async (transaction) => {
    const numberId = await getNextIDTransactional(
      transaction,
      user,
      'lastClientId',
      1,
    );

    const nextClient = {
      ...clientInput,
      id: clientId,
      numberId,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const { payload: writePayload, client } = buildClientWritePayload(nextClient);
    normalizedClient = client;

    const clientRef = db.doc(`businesses/${businessId}/clients/${clientId}`);
    transaction.set(
      clientRef,
      {
        ...writePayload,
        isDeleted: false,
        deletedAt: null,
      },
      { merge: true },
    );

    await incrementBusinessUsageMetric({
      businessId,
      metricKey: 'clientsTotal',
      incrementBy: 1,
      tx: transaction,
    });
  });

  return {
    ok: true,
    businessId,
    clientId,
    client: toSerializableClient(normalizedClient),
  };
});
