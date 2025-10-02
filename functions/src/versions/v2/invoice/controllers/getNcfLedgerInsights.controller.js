import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../../../../core/config/firebase.js';
import { getLedgerInsights } from '../services/ncfLedger.service.js';
import { sanitizePrefix } from '../utils/ncfLedger.util.js';
import {
  evaluateLedgerAccess,
  resolveUserBusinessId,
} from './ncfLedgerAccess.util.js';

const sanitizeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric;
};

export const getNcfLedgerInsights = onCall(async ({ data }, context) => {
  const businessId =
    data?.businessId ||
    data?.business?.id ||
    data?.business?.businessID ||
    data?.user?.businessID ||
    data?.user?.businessId ||
    null;

  const prefix = typeof data?.prefix === 'string' ? sanitizePrefix(data.prefix) : null;
  const userId = data?.userId || data?.user?.uid || context.auth?.uid || null;
  const normalizedDigits = typeof data?.normalizedDigits === 'string'
    ? data.normalizedDigits.trim()
    : null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  if (!prefix) {
    throw new HttpsError('invalid-argument', 'prefix es requerido');
  }

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId es requerido');
  }

  const sequenceNumber = sanitizeNumber(data?.sequenceNumber, Number(normalizedDigits));
  if (!Number.isFinite(sequenceNumber) || sequenceNumber < 0) {
    throw new HttpsError('invalid-argument', 'sequenceNumber inválido');
  }

  const increment = Math.max(sanitizeNumber(data?.increment, 1), 1);
  const windowBefore = sanitizeNumber(data?.windowBefore, data?.backwardSteps);
  const windowAfter = sanitizeNumber(data?.windowAfter, data?.forwardSteps);
  const quantitySteps = sanitizeNumber(data?.quantitySteps, 0);
  const sequenceLength = sanitizeNumber(data?.sequenceLength, normalizedDigits?.length ?? 0);

  const userSnap = await db.doc(`users/${userId}`).get();
  const { hasGlobalAccess } = evaluateLedgerAccess(userSnap, {
    errorMessage: 'No tienes permisos para consultar el ledger de NCF.',
  });

  const userBusinessId = resolveUserBusinessId(userSnap);
  if (!hasGlobalAccess && userBusinessId && userBusinessId !== businessId) {
    throw new HttpsError('permission-denied', 'Usuario no pertenece a este negocio');
  }

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
