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
    businessId,
    idempotencyKey: toCleanString(payload.idempotencyKey),
    movementIds: Array.isArray(payload.movementIds)
      ? payload.movementIds
          .map((movementId) => toCleanString(movementId))
          .filter(Boolean)
      : [],
    resolutionMode:
      toCleanString(payload.resolutionMode) === 'write_off'
        ? 'write_off'
        : 'match',
    statementLineId: toCleanString(payload.statementLineId),
    writeOffNotes: toCleanString(payload.writeOffNotes),
    writeOffReason: toCleanString(payload.writeOffReason),
  };
};

const assertPayload = ({
  businessId,
  idempotencyKey,
  resolutionMode,
  statementLineId,
  writeOffReason,
}) => {
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!statementLineId) {
    throw new HttpsError('invalid-argument', 'statementLineId es requerido.');
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }
  if (!['match', 'write_off'].includes(resolutionMode)) {
    throw new HttpsError(
      'invalid-argument',
      'resolutionMode debe ser match o write_off.',
    );
  }
  if (resolutionMode === 'write_off' && !writeOffReason) {
    throw new HttpsError(
      'invalid-argument',
      'writeOffReason es requerido para ajustar diferencia.',
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

const buildWriteOffAdjustmentMovement = ({
  authUid,
  bankAccountCurrency,
  bankAccountId,
  businessId,
  differenceAmount,
  matchedAmount,
  movementIds,
  now,
  statementLineId,
  statementLineRecord,
  writeOffNotes,
  writeOffReason,
}) => {
  const adjustmentAmount = roundToTwoDecimals(Math.abs(differenceAmount));
  const adjustmentDirection = differenceAmount < 0 ? 'out' : 'in';

  return {
    id: `bsladj_${statementLineId}`,
    amount: adjustmentAmount,
    bankAccountId,
    bankStatementLineId: statementLineId,
    businessId,
    createdAt: now,
    createdBy: authUid,
    currency: bankAccountCurrency,
    direction: adjustmentDirection,
    impactsBankLedger: true,
    impactsCashDrawer: false,
    metadata: {
      description: `Ajuste por diferencia bancaria (${writeOffReason})`,
      differenceAmount,
      linkedMovementIds: movementIds,
      matchedAmount,
      resolutionMode: 'write_off',
      statementLineId,
      writeOffNotes,
      writeOffReason,
    },
    method: 'transfer',
    occurredAt: statementLineRecord.statementDate ?? now,
    reconciliationStatus: 'reconciled',
    reconciledAt: now,
    reference: toCleanString(statementLineRecord.reference),
    sourceDocumentId: statementLineId,
    sourceDocumentType: 'bank_statement_line',
    sourceId: statementLineId,
    sourceType: 'bank_statement_adjustment',
    status: 'posted',
  };
};

export const resolveBankStatementLineMatch = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const {
    businessId,
    idempotencyKey,
    movementIds,
    resolutionMode,
    statementLineId,
    writeOffNotes,
    writeOffReason,
  } = resolvePayload(payload);

  assertPayload({
    businessId,
    idempotencyKey,
    resolutionMode,
    statementLineId,
    writeOffReason,
  });

  await assertAccess({
    authUid,
    businessId,
  });

  const requestHash = buildTreasuryIdempotencyRequestHash({
    businessId,
    movementIds,
    resolutionMode,
    statementLineId,
    writeOffNotes,
    writeOffReason,
  });
  const idempotencyRef = db.doc(
    `businesses/${businessId}/treasuryIdempotency/${idempotencyKey}`,
  );
  const statementLineRef = db.doc(
    `businesses/${businessId}/bankStatementLines/${statementLineId}`,
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

      const existingStatementLineSnap = await transaction.get(statementLineRef);
      if (!existingStatementLineSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La línea a resolver ya no existe.',
        );
      }

      result = {
        differenceAmount: roundToTwoDecimals(
          existingStatementLineSnap.get('metadata.differenceAmount'),
        ),
        matchedAmount: roundToTwoDecimals(
          existingStatementLineSnap.get('metadata.matchedAmount'),
        ),
        ok: true,
        resolutionMode:
          toCleanString(existingStatementLineSnap.get('metadata.resolutionMode')) ||
          (toCleanString(existingStatementLineSnap.get('status')) === 'written_off'
            ? 'write_off'
            : 'match'),
        reused: true,
        statementLineId,
        statementLine: sanitizeForResponse({
          id: existingStatementLineSnap.id,
          ...existingStatementLineSnap.data(),
        }),
      };
      return;
    }

    const statementLineSnap = await transaction.get(statementLineRef);
    if (!statementLineSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La línea pendiente ya no existe.',
      );
    }

    const statementLineRecord = asRecord(statementLineSnap.data());
    if (toCleanString(statementLineRecord.status) !== 'pending') {
      throw new HttpsError(
        'failed-precondition',
        'Solo puedes resolver líneas pendientes.',
      );
    }
    if (toCleanString(statementLineRecord.lineType) !== 'transaction') {
      throw new HttpsError(
        'failed-precondition',
        'Solo puedes resolver líneas transaccionales.',
      );
    }

    const bankAccountId = toCleanString(statementLineRecord.bankAccountId);
    const statementDateMillis = toMillis(statementLineRecord.statementDate);
    const statementAmount = roundToTwoDecimals(statementLineRecord.amount);
    const statementDirection =
      statementLineRecord.direction === 'out' ? 'out' : 'in';
    const signedStatementAmount =
      statementDirection === 'out'
        ? roundToTwoDecimals(-statementAmount)
        : statementAmount;

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
          'Todos los movimientos deben pertenecer a la cuenta bancaria de la línea.',
        );
      }
      if (toCleanString(movementRecord.reconciliationStatus) === 'reconciled') {
        throw new HttpsError(
          'failed-precondition',
          'Uno de los movimientos ya fue conciliado.',
        );
      }
      const movementMillis = toMillis(
        movementRecord.occurredAt ?? movementRecord.createdAt,
      );
      if (
        statementDateMillis != null &&
        movementMillis != null &&
        movementMillis > statementDateMillis
      ) {
        throw new HttpsError(
          'failed-precondition',
          'No puedes conciliar movimientos posteriores a la fecha del extracto.',
        );
      }

      matchedAmount = roundToTwoDecimals(
        matchedAmount + resolveMovementSignedAmount(movementRecord),
      );
    });

    const now = Timestamp.now();
    const differenceAmount = roundToTwoDecimals(
      signedStatementAmount - matchedAmount,
    );
    let nextStatementLineStatus = 'reconciled';
    let adjustmentMovement = null;

    if (resolutionMode === 'match') {
      if (
        movementSnaps.length === 0 ||
        roundToTwoDecimals(matchedAmount) !== signedStatementAmount
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Los movimientos seleccionados no cuadran exactamente con la línea pendiente.',
        );
      }
    } else {
      if (differenceAmount === 0) {
        throw new HttpsError(
          'failed-precondition',
          'La diferencia ya es cero. Usa match exacto para cerrar la línea.',
        );
      }

      const bankAccountRef = db.doc(
        `businesses/${businessId}/bankAccounts/${bankAccountId}`,
      );
      const bankAccountSnap = await transaction.get(bankAccountRef);
      if (!bankAccountSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La cuenta bancaria de la línea ya no existe.',
        );
      }

      adjustmentMovement = buildWriteOffAdjustmentMovement({
        authUid,
        bankAccountCurrency: toCleanString(bankAccountSnap.get('currency')) || 'DOP',
        bankAccountId,
        businessId,
        differenceAmount,
        matchedAmount,
        movementIds,
        now,
        statementLineId,
        statementLineRecord,
        writeOffNotes,
        writeOffReason,
      });
      nextStatementLineStatus = 'written_off';

      transaction.set(
        db.doc(
          `businesses/${businessId}/cashMovements/${adjustmentMovement.id}`,
        ),
        adjustmentMovement,
      );
    }

    transaction.set(
      statementLineRef,
      {
        status: nextStatementLineStatus,
        updatedAt: now,
        updatedBy: authUid,
        metadata: {
          ...asRecord(statementLineRecord.metadata),
          adjustmentMovementId: adjustmentMovement?.id ?? null,
          differenceAmount,
          exceptionCode: null,
          matchedAmount,
          movementIds,
          resolutionMode,
          resolvedAt: now,
          resolvedBy: authUid,
          writeOffNotes,
          writeOffReason,
        },
      },
      { merge: true },
    );

    movementSnaps.forEach((movementSnap) => {
      transaction.set(
        db.doc(`businesses/${businessId}/cashMovements/${movementSnap.id}`),
        {
          bankStatementLineId: statementLineId,
          reconciliationStatus: 'reconciled',
          reconciledAt: now,
        },
        { merge: true },
      );
    });

    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      command: 'resolveBankStatementLineMatch',
      requestHash,
      statementLineId,
      sourceDocumentType: 'bank_statement_line',
      sourceDocumentId: statementLineId,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      responseSnapshot: {
        differenceAmount,
        matchedAmount,
        ok: true,
        resolutionMode,
        reused: false,
        statementLineId,
      },
    });

    result = {
      differenceAmount,
      matchedAmount,
      ok: true,
      resolutionMode,
      reused: false,
      statementLineId,
      statementLine: sanitizeForResponse({
        id: statementLineSnap.id,
        ...statementLineRecord,
        metadata: {
          ...asRecord(statementLineRecord.metadata),
          adjustmentMovementId: adjustmentMovement?.id ?? null,
          differenceAmount,
          exceptionCode: null,
          matchedAmount,
          movementIds,
          resolutionMode,
          resolvedAt: now,
          resolvedBy: authUid,
          writeOffNotes,
          writeOffReason,
        },
        status: nextStatementLineStatus,
        updatedAt: now,
        updatedBy: authUid,
      }),
    };
  });

  return result;
});
