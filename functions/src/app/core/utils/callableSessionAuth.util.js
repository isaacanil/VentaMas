import { HttpsError } from 'firebase-functions/v2/https';

import { db, FieldValue } from '../config/firebase.js';
import { toCleanString } from '../../versions/v2/billing/utils/billingCommon.util.js';

const SESSION_COLLECTION = 'sessionTokens';

const sessionsCol = db.collection(SESSION_COLLECTION);

export const resolveCallableAuthUid = async (request) => {
  const sessionToken = toCleanString(request?.data?.sessionToken);
  if (!sessionToken) {
    return request?.auth?.uid || null;
  }

  const sessionRef = sessionsCol.doc(sessionToken);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new HttpsError('unauthenticated', 'Sesion invalida o expirada');
  }

  const data = sessionSnap.data() || {};
  const userId = toCleanString(data.userId);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Sesion sin usuario asociado');
  }

  await sessionRef.set(
    {
      lastActivity: FieldValue.serverTimestamp(),
      status: 'active',
    },
    { merge: true },
  );

  return userId;
};
