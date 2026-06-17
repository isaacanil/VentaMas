import { HttpsError } from 'firebase-functions/v2/https';

import { resolveCallableAuthUid } from '../../../../core/utils/callableSessionAuth.util.js';
import { toCleanString } from '../../../../core/utils/string.util.js';

const resolvePayloadUserId = (data) =>
  toCleanString(data?.userId) || toCleanString(data?.user?.uid);

export const resolveRequiredCallableActorUid = async (
  request,
  {
    mismatchMessage = 'userId no coincide con el usuario autenticado',
  } = {},
) => {
  const authUid = toCleanString(await resolveCallableAuthUid(request));
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payloadUserId = resolvePayloadUserId(request?.data || {});
  if (payloadUserId && payloadUserId !== authUid) {
    throw new HttpsError('permission-denied', mismatchMessage);
  }

  return authUid;
};
