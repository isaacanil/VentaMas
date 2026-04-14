import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

import { buildTreasuryIdempotencyRequestHash } from './treasuryIdempotency.shared.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

const timestampFromMillis = (value) => {
  if (typeof Timestamp.fromMillis === 'function') {
    return Timestamp.fromMillis(value);
  }
  return new Timestamp(value);
};

const sanitizeForResponse = (value) => {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForResponse(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (nestedValue === undefined) return;
    next[key] = sanitizeForResponse(nestedValue);
  });
  return next;
};

const resolveMovementSignedAmount = (movementRecord) => {
  const amount = roundToTwoDecimals(movementRecord.amount);
  if (amount <= 0) return 0;
  return movementRecord.direction === 'out' ? -amount : amount;
};

const isMovementPosted = (movementRecord) => {
  const normalizedStatus = toCleanString(movementRecord.status)?.toLowerCase();
  return normalizedStatus !== 'void' && normalizedStatus !== 'draft';
};

export const createBankReconciliation = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const bankAccountId = toCleanString(payload.bankAccountId);
  const idempotencyKey = toCleanString(payload.idempotencyKey);
  const reference = toCleanString(payload.reference);
  const note = toCleanString(payload.note ?? payload.notes);
  const statementBalance = roundToTwoDecimals(payload.statementBalance);
  const statementDateMillis = toMillis(payload.statementDate) ?? Date.now();

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!bankAccountId) {
    throw new HttpsError('invalid-argument', 'bankAccountId es requerido.');
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }
  if (!Number.isFinite(statementBalance)) {
    throw new HttpsError(
      'invalid-argument',
      'statementBalance debe ser numérico.',
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
    requiredModule: 'cashReconciliation',
  });

  const requestHash = buildTreasuryIdempotencyRequestHash({
    businessId,
    bankAccountId,
    statementBalance,
    statementDate: statementDateMillis,
    reference,
    note,
  });

  const bankAccountRef = db.doc(
    `businesses/${businessId}/bankAccounts/${bankAccountId}`,
  );
  const idempotencyRef = db.doc(
    `businesses/${businessId}/treasuryIdempotency/${idempotencyKey}`,
  );

  const bankAccountSnap = await bankAccountRef.get();
  if (!bankAccountSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta bancaria seleccionada no existe.',
    );
  }
  const bankAccount = asRecord(bankAccountSnap.data());
  const bankAccountStatus = toCleanString(bankAccount.status)?.toLowerCase();
  if (bankAccountStatus && bankAccountStatus !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta bancaria seleccionada no está activa.',
    );
  }

  const statementDate = timestampFromMillis(statementDateMillis);
  const cashMovementsSnap = await db
    .collection(`businesses/${businessId}/cashMovements`)
    .where('bankAccountId', '==', bankAccountId)
    .get();
  const ledgerBalance = roundToTwoDecimals(
    roundToTwoDecimals(bankAccount.openingBalance) +
      cashMovementsSnap.docs.reduce((sum, movementSnap) => {
        const movementRecord = asRecord(movementSnap.data());
        if (!isMovementPosted(movementRecord)) {
          return sum;
        }
        const movementMillis = toMillis(
          movementRecord.occurredAt ?? movementRecord.createdAt,
        );
        if (movementMillis != null && movementMillis > statementDateMillis) {
          return sum;
        }
        return sum + resolveMovementSignedAmount(movementRecord);
      }, 0),
  );
  const variance = roundToTwoDecimals(statementBalance - ledgerBalance);

  let result = null;

  await db.runTransaction(async (transaction) => {
    const idempotencySnap = await transaction.get(idempotencyRef);
    if (idempotencySnap.exists) {
      const idempotencyRecord = asRecord(idempotencySnap.data());
      const storedHash = toCleanString(idempotencyRecord.requestHash);
      if (storedHash && storedHash !== requestHash) {
        throw new HttpsError(
          'already-exists',
          'La llave de idempotencia ya fue utilizada con otro payload.',
        );
      }

      const existingReconciliationId = toCleanString(
        idempotencyRecord.reconciliationId,
      );
      if (!existingReconciliationId) {
        throw new HttpsError(
          'failed-precondition',
          'El registro de idempotencia no apunta a una conciliación válida.',
        );
      }

      const existingReconciliationRef = db.doc(
        `businesses/${businessId}/bankReconciliations/${existingReconciliationId}`,
      );
      const existingReconciliationSnap = await transaction.get(
        existingReconciliationRef,
      );
      if (!existingReconciliationSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La conciliación reutilizada por idempotencia ya no existe.',
        );
      }

      result = {
        ok: true,
        reused: true,
        reconciliationId: existingReconciliationId,
        reconciliation: sanitizeForResponse({
          id: existingReconciliationSnap.id,
          ...existingReconciliationSnap.data(),
        }),
      };
      return;
    }

    const reconciliationRef = db.collection(
      `businesses/${businessId}/bankReconciliations`,
    ).doc();
    const now = Timestamp.now();
    const reconciliationRecord = {
      id: reconciliationRef.id,
      businessId,
      bankAccountId,
      statementDate,
      statementBalance,
      ledgerBalance,
      variance,
      status: variance === 0 ? 'balanced' : 'variance',
      reference,
      notes: note,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      updatedBy: authUid,
      metadata: {
        idempotencyKey,
      },
    };

    transaction.set(reconciliationRef, reconciliationRecord);
    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      command: 'createBankReconciliation',
      requestHash,
      reconciliationId: reconciliationRef.id,
      sourceDocumentType: 'bank_reconciliation',
      sourceDocumentId: reconciliationRef.id,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      responseSnapshot: {
        ok: true,
        reused: false,
        reconciliationId: reconciliationRef.id,
        reconciliation: sanitizeForResponse(reconciliationRecord),
      },
    });

    result = {
      ok: true,
      reused: false,
      reconciliationId: reconciliationRef.id,
      reconciliation: sanitizeForResponse(reconciliationRecord),
    };
  });

  return result;
});
