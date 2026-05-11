import { HttpsError } from 'firebase-functions/v2/https';

import { toCleanString } from '../../versions/v2/billing/utils/billingCommon.util.js';
import { resolveUserIdFromSessionToken } from '../../versions/v2/auth/utils/sessionAuth.util.js';

export const resolveCallableAuthUid = async (request) => {
  const sessionToken = toCleanString(request?.data?.sessionToken);
  if (!sessionToken) {
    return request?.auth?.uid || null;
  }

  return resolveUserIdFromSessionToken({
    sessionToken,
    normalizeUserId: toCleanString,
    createAuthError: (message) => new HttpsError('unauthenticated', message),
    messages: {
      invalidSession: 'Sesion invalida o expirada',
      missingUser: 'Sesion sin usuario asociado',
      expired: 'La sesion ha expirado',
      inactive: 'Sesion cerrada por inactividad',
    },
  });
};
