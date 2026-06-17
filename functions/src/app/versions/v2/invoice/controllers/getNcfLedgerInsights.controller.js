import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { getLedgerInsights } from '../services/ncfLedger.service.js';
import { sanitizePrefix } from '../utils/ncfLedger.util.js';

import { resolveRequiredCallableActorUid } from './invoiceCallableAuth.util.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../auth/services/userAccess.service.js';

const sanitizeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric;
};

export const getNcfLedgerInsights = onCall(async (request) => {
  const data = request?.data || {};
  const businessId =
    data?.businessId ||
    data?.business?.id ||
    data?.business?.businessID ||
    data?.user?.businessID ||
    data?.user?.businessId ||
    null;

  const prefix =
    typeof data?.prefix === 'string' ? sanitizePrefix(data.prefix) : null;
  const userId = await resolveRequiredCallableActorUid(request);
  const normalizedDigits =
    typeof data?.normalizedDigits === 'string'
      ? data.normalizedDigits.trim()
      : null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  if (!prefix) {
    throw new HttpsError('invalid-argument', 'prefix es requerido');
  }

  const sequenceNumber = sanitizeNumber(
    data?.sequenceNumber,
    Number(normalizedDigits),
  );
  if (!Number.isFinite(sequenceNumber) || sequenceNumber < 0) {
    throw new HttpsError('invalid-argument', 'sequenceNumber inválido');
  }

  const increment = Math.max(sanitizeNumber(data?.increment, 1), 1);
  const windowBefore = sanitizeNumber(data?.windowBefore, data?.backwardSteps);
  const windowAfter = sanitizeNumber(data?.windowAfter, data?.forwardSteps);
  const quantitySteps = sanitizeNumber(data?.quantitySteps, 0);
  const sequenceLength = sanitizeNumber(
    data?.sequenceLength,
    normalizedDigits?.length ?? 0,
  );

  await assertUserAccess({
    authUid: userId,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
  });

  const insights = await getLedgerInsights({
    businessId,
    prefix,
    sequenceNumber,
    normalizedDigits,
    increment,
    windowBefore,
    windowAfter,
    quantitySteps,
    expectedSequenceLength: sequenceLength,
  });

  return insights;
});
