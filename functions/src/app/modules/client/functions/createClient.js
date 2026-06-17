import { onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { getNextIDTransactional } from '../../../core/utils/getNextID.js';
import { buildClientWritePayload } from '../utils/clientNormalizer.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import { prepareLimitedCreateOperation } from '../../../versions/v2/billing/utils/limitedCreateOperation.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const toSerializableClient = (client) => {
  if (!client || typeof client !== 'object') return null;
  const next = { ...client };
  delete next.createdAt;
  delete next.updatedAt;
  delete next.deletedAt;
  return next;
};

export const createClient = onCall(async (request) => {
  const {
    authUid,
    businessId,
    input: clientInput,
    metricKey,
    incrementBy,
  } = await prepareLimitedCreateOperation({
    request,
    inputKey: 'client',
    operation: LIMIT_OPERATION_KEYS.CLIENT_CREATE,
    inputBusinessIdKeys: ['businessID'],
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
      metricKey,
      incrementBy,
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
