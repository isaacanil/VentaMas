import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { getNextIDTransactional } from '../../../core/utils/getNextID.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString, toFiniteNumber } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toUserRef = (userId) => {
  const normalized = toCleanString(userId);
  return normalized ? db.doc(`users/${normalized}`) : null;
};

const sanitizeBanknotes = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const banknote = asRecord(entry);
    return {
      ref: toCleanString(banknote.ref) || '',
      value: toFiniteNumber(banknote.value, 0),
      quantity: toFiniteNumber(banknote.quantity, 0),
    };
  });
};

export const openCashCount = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const cashCountInput = asRecord(payload.cashCount);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const employeeId =
    toCleanString(payload.employeeID) ||
    toCleanString(payload.employeeId) ||
    authUid;
  const approvalEmployeeId =
    toCleanString(payload.approvalEmployeeID) ||
    toCleanString(payload.approvalEmployeeId) ||
    null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!approvalEmployeeId) {
    throw new HttpsError(
      'invalid-argument',
      'approvalEmployeeID es requerido',
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
    operation: LIMIT_OPERATION_KEYS.CASH_REGISTER_OPEN,
  });

  const employeeRef = toUserRef(employeeId);
  if (!employeeRef) {
    throw new HttpsError('invalid-argument', 'employeeID es requerido');
  }

  const existingOpenSnap = await db
    .collection(`businesses/${businessId}/cashCounts`)
    .where('cashCount.state', 'in', ['open', 'closing'])
    .where('cashCount.opening.employee', '==', employeeRef)
    .limit(1)
    .get();

  if (!existingOpenSnap.empty) {
    throw new HttpsError(
      'failed-precondition',
      'Ya existe un cuadre de caja abierto para este usuario',
    );
  }

  const user = { uid: authUid, businessID: businessId };
  const cashCountId = toCleanString(cashCountInput.id) || nanoid(10);
  const openingDate = Timestamp.fromMillis(
    toMillis(payload.openingDate) ?? Date.now(),
  );

  await db.runTransaction(async (transaction) => {
    const incrementNumber = await getNextIDTransactional(
      transaction,
      user,
      'lastCashCountId',
      1,
    );

    const cashCountRef = db.doc(
      `businesses/${businessId}/cashCounts/${cashCountId}`,
    );
    transaction.set(cashCountRef, {
      cashCount: {
        ...cashCountInput,
        id: cashCountId,
        incrementNumber,
        createdAt: Timestamp.fromMillis(Date.now()),
        updatedAt: Timestamp.fromMillis(Date.now()),
        state: 'open',
        opening: {
          ...asRecord(cashCountInput.opening),
          employee: employeeRef,
          approvalEmployee: toUserRef(approvalEmployeeId),
          initialized: true,
          date: openingDate,
          banknotes: sanitizeBanknotes(asRecord(cashCountInput.opening).banknotes),
        },
        stateHistory: [{
          state: 'open',
          timestamp: Timestamp.fromMillis(Date.now()),
          updatedBy: authUid,
        }],
      },
    });
  });

  await incrementBusinessUsageMetric({
    businessId,
    metricKey: 'openCashRegisters',
    incrementBy: 1,
  });

  return {
    ok: true,
    businessId,
    cashCountId,
  };
});
