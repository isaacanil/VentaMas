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

const resolvePayload = (payload) => {
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;

  return {
    amount: roundToTwoDecimals(payload.amount),
    bankAccountId: toCleanString(payload.bankAccountId),
    businessId,
    description: toCleanString(payload.description),
    direction: payload.direction === 'out' ? 'out' : payload.direction === 'in' ? 'in' : null,
    idempotencyKey: toCleanString(payload.idempotencyKey),
    movementIds: Array.isArray(payload.movementIds)
      ? payload.movementIds
          .map((movementId) => toCleanString(movementId))
          .filter(Boolean)
      : [],
    reference: toCleanString(payload.reference),
    statementDateMillis: toMillis(payload.statementDate),
  };
};

const assertPayload = ({
  amount,
  bankAccountId,
  businessId,
  direction,
  idempotencyKey,
  payload,
  statementDateMillis,
}) => {
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!bankAccountId) {
    throw new HttpsError('invalid-argument', 'bankAccountId es requerido.');
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }
  if (!direction) {
    throw new HttpsError('invalid-argument', 'direction debe ser in o out.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError('invalid-argument', 'amount debe ser mayor que 0.');
  }
  if (payload.statementDate != null && statementDateMillis == null) {
    throw new HttpsError(
      'invalid-argument',
      'statementDate debe ser una fecha válida.',
    );
  }
};

const assertAccess = async ({
  authUid,
  businessId,
}) => {
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
};

export const createBankStatementLine = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const {
    amount,
    bankAccountId,
    businessId,
    description,
    direction,
    idempotencyKey,
    movementIds,
    reference,
    statementDateMillis,
  } = resolvePayload(payload);

  assertPayload({
    amount,
    bankAccountId,
    businessId,
    direction,
    idempotencyKey,
    payload,
    statementDateMillis,
  });

  await assertAccess({
    authUid,
    businessId,
  });

  const resolvedStatementDateMillis = statementDateMillis ?? Date.now();
  const statementDate = timestampFromMillis(resolvedStatementDateMillis);
  const signedStatementAmount =
    direction === 'out' ? roundToTwoDecimals(-amount) : amount;
  const requestHash = buildTreasuryIdempotencyRequestHash({
    amount,
    bankAccountId,
    businessId,
    description,
    direction,
    movementIds,
    reference,
    statementDate: resolvedStatementDateMillis,
  });

  const bankAccountRef = db.doc(
    `businesses/${businessId}/bankAccounts/${bankAccountId}`,
  );
  const idempotencyRef = db.doc(
    `businesses/${businessId}/treasuryIdempotency/${idempotencyKey}`,
  );

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

      const existingStatementLineId = toCleanString(idempotencyRecord.statementLineId);
      if (!existingStatementLineId) {
        throw new HttpsError(
          'failed-precondition',
          'El registro de idempotencia no apunta a una línea válida.',
        );
      }

      const existingStatementLineRef = db.doc(
        `businesses/${businessId}/bankStatementLines/${existingStatementLineId}`,
      );
      const existingStatementLineSnap = await transaction.get(
        existingStatementLineRef,
      );
      if (!existingStatementLineSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La línea reutilizada por idempotencia ya no existe.',
        );
      }

      result = {
        exactMatch: toCleanString(existingStatementLineSnap.get('status')) === 'reconciled',
        matchStatus:
          toCleanString(existingStatementLineSnap.get('status')) === 'reconciled'
            ? 'reconciled'
            : 'pending',
        matchedAmount: roundToTwoDecimals(
          existingStatementLineSnap.get('metadata.matchedAmount'),
        ),
        ok: true,
        reused: true,
        statementLineId: existingStatementLineId,
        statementLine: sanitizeForResponse({
          id: existingStatementLineSnap.id,
          ...existingStatementLineSnap.data(),
        }),
      };
      return;
    }

    const bankAccountSnap = await transaction.get(bankAccountRef);
    if (!bankAccountSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta bancaria seleccionada no existe.',
      );
    }
    const bankAccountRecord = asRecord(bankAccountSnap.data());
    const bankAccountStatus =
      toCleanString(bankAccountRecord.status)?.toLowerCase() || 'inactive';
    if (bankAccountStatus !== 'active') {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta bancaria seleccionada no está activa.',
      );
    }

    const movementRefs = movementIds.map((movementId) =>
      db.doc(`businesses/${businessId}/cashMovements/${movementId}`),
    );
    const movementSnaps = await Promise.all(
      movementRefs.map((movementRef) => transaction.get(movementRef)),
    );

    let matchedAmount = 0;
    movementSnaps.forEach((movementSnap) => {
      if (!movementSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Uno de los movimientos seleccionados ya no existe.',
        );
      }

      const movementRecord = asRecord(movementSnap.data());
      if (!isMovementPosted(movementRecord)) {
        throw new HttpsError(
          'failed-precondition',
          'Solo se pueden conciliar movimientos publicados.',
        );
      }
      if (toCleanString(movementRecord.bankAccountId) !== bankAccountId) {
        throw new HttpsError(
          'failed-precondition',
          'Todos los movimientos deben pertenecer a la cuenta bancaria seleccionada.',
        );
      }
      const reconciliationStatus =
        toCleanString(movementRecord.reconciliationStatus) ?? 'unreconciled';
      if (reconciliationStatus === 'reconciled') {
        throw new HttpsError(
          'failed-precondition',
          'Uno de los movimientos ya fue conciliado.',
        );
      }
      const movementMillis = toMillis(
        movementRecord.occurredAt ?? movementRecord.createdAt,
      );
      if (movementMillis != null && movementMillis > resolvedStatementDateMillis) {
        throw new HttpsError(
          'failed-precondition',
          'No puedes conciliar movimientos posteriores a la fecha del extracto.',
        );
      }

      matchedAmount = roundToTwoDecimals(
        matchedAmount + resolveMovementSignedAmount(movementRecord),
      );
    });

    const exactMatch =
      movementSnaps.length > 0 &&
      roundToTwoDecimals(matchedAmount) === signedStatementAmount;
    const status = exactMatch ? 'reconciled' : 'pending';
    const exceptionCode =
      movementSnaps.length === 0
        ? 'unmatched'
        : exactMatch
          ? null
          : 'amount_mismatch';
    const now = Timestamp.now();
    const statementLineRef = db.collection(
      `businesses/${businessId}/bankStatementLines`,
    ).doc();
    const statementLineRecord = {
      id: statementLineRef.id,
      businessId,
      bankAccountId,
      reconciliationId: null,
      lineType: 'transaction',
      status,
      statementDate,
      amount,
      runningBalance: null,
      direction,
      description,
      reference,
      createdAt: now,
      createdBy: authUid,
      metadata: {
        exceptionCode,
        idempotencyKey,
        matchedAmount,
        movementIds,
        signedStatementAmount,
      },
    };

    transaction.set(statementLineRef, statementLineRecord);

    if (exactMatch) {
      movementSnaps.forEach((movementSnap) => {
        transaction.set(
          db.doc(`businesses/${businessId}/cashMovements/${movementSnap.id}`),
          {
            bankStatementLineId: statementLineRef.id,
            reconciliationStatus: 'reconciled',
            reconciledAt: now,
          },
          { merge: true },
        );
      });
    }

    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      command: 'createBankStatementLine',
      requestHash,
      statementLineId: statementLineRef.id,
      sourceDocumentType: 'bank_statement_line',
      sourceDocumentId: statementLineRef.id,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      responseSnapshot: {
        ok: true,
        reused: false,
        statementLineId: statementLineRef.id,
        statementLine: sanitizeForResponse(statementLineRecord),
      },
    });

    result = {
      exactMatch,
      matchStatus: status,
      matchedAmount,
      ok: true,
      reused: false,
      statementLineId: statementLineRef.id,
      statementLine: sanitizeForResponse(statementLineRecord),
    };
  });

  return result;
});
