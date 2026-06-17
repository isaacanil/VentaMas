import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  asRecord,
  toCleanString,
  toFiniteNumber,
} from '../../../versions/v2/billing/utils/billingCommon.util.js';
import {
  isMovementPosted,
  resolveMovementSignedAmount,
} from '../utils/cashMovementReconciliation.util.js';
import { assertTreasuryCashReconciliationWriteAccess } from '../utils/treasuryAccess.util.js';
import {
  sanitizeForResponse,
  timestampFromMillis,
  toMillis,
} from '../utils/treasuryTimestamp.util.js';

import { buildTreasuryIdempotencyRequestHash } from './treasuryIdempotency.shared.js';

const roundToTwoDecimals = (value) =>
  Math.round(toFiniteNumber(value) * 100) / 100;

const parseMoneyAmount = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? roundToTwoDecimals(parsed) : null;
};

const classifyMovementsForReconciliation = ({
  cashMovementsSnap,
  periodStartMillis,
  resolvedStatementDateMillis,
}) => {
  const openingMovementSnaps = [];
  const periodMovementSnaps = [];
  let unreconciledMovementCount = 0;

  cashMovementsSnap.docs.forEach((movementSnap) => {
    const movementRecord = asRecord(movementSnap.data());
    if (!isMovementPosted(movementRecord)) {
      return;
    }

    const movementMillis = toMillis(
      movementRecord.occurredAt ?? movementRecord.createdAt,
    );
    if (
      movementMillis != null &&
      movementMillis > resolvedStatementDateMillis
    ) {
      unreconciledMovementCount += 1;
      return;
    }

    if (
      periodStartMillis != null &&
      movementMillis != null &&
      movementMillis < periodStartMillis
    ) {
      openingMovementSnaps.push(movementSnap);
      return;
    }

    periodMovementSnaps.push(movementSnap);
  });

  return {
    openingMovementSnaps,
    periodMovementSnaps,
    unreconciledMovementCount,
  };
};

const resolveBankReconciliationPayload = (payload) => {
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const bankAccountId = toCleanString(payload.bankAccountId);
  const openingStatementBalance = parseMoneyAmount(
    payload.openingStatementBalance,
  );
  const periodStartMillis = toMillis(payload.periodStart);
  const reference = toCleanString(payload.reference);
  const note = toCleanString(payload.note ?? payload.notes);
  const statementBalance = parseMoneyAmount(payload.statementBalance);
  const statementDateMillis = toMillis(payload.statementDate);

  return {
    bankAccountId,
    businessId,
    note,
    openingStatementBalance,
    periodStartMillis,
    reference,
    statementBalance,
    statementDateMillis,
  };
};

const assertBankReconciliationPayload = ({
  bankAccountId,
  businessId,
  requireIdempotencyKey = false,
  openingStatementBalance,
  periodStartMillis,
  statementBalance,
  statementDateMillis,
  payload,
  idempotencyKey = null,
}) => {
  if (requireIdempotencyKey && !idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!bankAccountId) {
    throw new HttpsError('invalid-argument', 'bankAccountId es requerido.');
  }
  if (!Number.isFinite(statementBalance)) {
    throw new HttpsError(
      'invalid-argument',
      'statementBalance debe ser numérico.',
    );
  }
  if (!Number.isFinite(openingStatementBalance)) {
    throw new HttpsError(
      'invalid-argument',
      'openingStatementBalance debe ser numérico.',
    );
  }
  if (payload.statementDate == null || statementDateMillis == null) {
    throw new HttpsError(
      'invalid-argument',
      'statementDate debe ser una fecha válida y requerida.',
    );
  }
  if (payload.periodStart == null || periodStartMillis == null) {
    throw new HttpsError(
      'invalid-argument',
      'periodStart debe ser una fecha válida y requerida.',
    );
  }
  if (periodStartMillis > statementDateMillis) {
    throw new HttpsError(
      'invalid-argument',
      'periodStart no puede ser posterior a statementDate.',
    );
  }
};

const assertBankReconciliationAccess = async ({ authUid, businessId }) => {
  await assertTreasuryCashReconciliationWriteAccess({
    authUid,
    businessId,
  });
};

const buildReconciliationPreview = async ({
  bankAccountId,
  businessId,
  openingStatementBalance,
  periodStartMillis,
  resolvedStatementDateMillis,
  statementBalance,
  transaction,
}) => {
  const bankAccountRef = db.doc(
    `businesses/${businessId}/bankAccounts/${bankAccountId}`,
  );
  const bankAccountSnap = transaction
    ? await transaction.get(bankAccountRef)
    : await bankAccountRef.get();
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

  const cashMovementsQuery = db
    .collection(`businesses/${businessId}/cashMovements`)
    .where('bankAccountId', '==', bankAccountId);
  const cashMovementsSnap = transaction
    ? await transaction.get(cashMovementsQuery)
    : await cashMovementsQuery.get();
  const {
    openingMovementSnaps,
    periodMovementSnaps,
    unreconciledMovementCount,
  } = classifyMovementsForReconciliation({
    cashMovementsSnap,
    periodStartMillis,
    resolvedStatementDateMillis,
  });
  const ledgerOpeningBalance = roundToTwoDecimals(
    roundToTwoDecimals(bankAccount.openingBalance) +
      openingMovementSnaps.reduce((sum, movementSnap) => {
        const movementRecord = asRecord(movementSnap.data());
        return sum + resolveMovementSignedAmount(movementRecord);
      }, 0),
  );
  const ledgerPeriodMovementTotal = roundToTwoDecimals(
    periodMovementSnaps.reduce((sum, movementSnap) => {
      const movementRecord = asRecord(movementSnap.data());
      return sum + resolveMovementSignedAmount(movementRecord);
    }, 0),
  );
  const ledgerBalance = roundToTwoDecimals(
    ledgerOpeningBalance + ledgerPeriodMovementTotal,
  );
  const statementMovementTotal = roundToTwoDecimals(
    statementBalance - openingStatementBalance,
  );
  const openingVariance = roundToTwoDecimals(
    openingStatementBalance - ledgerOpeningBalance,
  );
  const periodVariance = roundToTwoDecimals(
    statementMovementTotal - ledgerPeriodMovementTotal,
  );
  const variance = roundToTwoDecimals(statementBalance - ledgerBalance);
  const status =
    openingVariance === 0 && periodVariance === 0 && variance === 0
      ? 'balanced'
      : 'variance';

  return {
    bankAccount,
    carriedMovementCount: openingMovementSnaps.length,
    ledgerBalance,
    ledgerOpeningBalance,
    ledgerPeriodMovementTotal,
    openingVariance,
    periodMovementCount: periodMovementSnaps.length,
    periodMovementSnaps,
    periodVariance,
    statementMovementTotal,
    status,
    reconciledMovementCount: periodMovementSnaps.length,
    unreconciledMovementCount,
    variance,
  };
};

export const previewBankReconciliation = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const {
    bankAccountId,
    businessId,
    openingStatementBalance,
    periodStartMillis,
    statementBalance,
    statementDateMillis,
  } = resolveBankReconciliationPayload(payload);

  assertBankReconciliationPayload({
    bankAccountId,
    businessId,
    openingStatementBalance,
    periodStartMillis,
    payload,
    statementBalance,
    statementDateMillis,
  });

  await assertBankReconciliationAccess({
    authUid,
    businessId,
  });

  const resolvedStatementDateMillis = statementDateMillis;
  const resolvedPeriodStartMillis = periodStartMillis;
  const statementDate = timestampFromMillis(resolvedStatementDateMillis);
  const periodStart = timestampFromMillis(resolvedPeriodStartMillis);
  const preview = await buildReconciliationPreview({
    bankAccountId,
    businessId,
    openingStatementBalance,
    periodStartMillis: resolvedPeriodStartMillis,
    resolvedStatementDateMillis,
    statementBalance,
  });

  return {
    ok: true,
    preview: sanitizeForResponse({
      bankAccountId,
      carriedMovementCount: preview.carriedMovementCount,
      ledgerBalance: preview.ledgerBalance,
      ledgerOpeningBalance: preview.ledgerOpeningBalance,
      ledgerPeriodMovementTotal: preview.ledgerPeriodMovementTotal,
      openingStatementBalance,
      openingVariance: preview.openingVariance,
      periodEnd: statementDate,
      periodMovementCount: preview.periodMovementCount,
      periodStart,
      periodVariance: preview.periodVariance,
      reconciledMovementCount: preview.reconciledMovementCount,
      referenceDate: statementDate,
      statementBalance,
      statementDate,
      statementMovementTotal: preview.statementMovementTotal,
      status: preview.status,
      unreconciledMovementCount: preview.unreconciledMovementCount,
      variance: preview.variance,
    }),
  };
});

export const createBankReconciliation = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const {
    bankAccountId,
    businessId,
    note,
    openingStatementBalance,
    periodStartMillis,
    reference,
    statementBalance,
    statementDateMillis,
  } = resolveBankReconciliationPayload(payload);
  const idempotencyKey = toCleanString(payload.idempotencyKey);

  assertBankReconciliationPayload({
    bankAccountId,
    businessId,
    idempotencyKey,
    openingStatementBalance,
    periodStartMillis,
    payload,
    requireIdempotencyKey: true,
    statementBalance,
    statementDateMillis,
  });

  await assertBankReconciliationAccess({
    authUid,
    businessId,
  });

  const resolvedStatementDateMillis = statementDateMillis;
  const resolvedPeriodStartMillis = periodStartMillis;
  const requestHash = buildTreasuryIdempotencyRequestHash({
    businessId,
    bankAccountId,
    openingStatementBalance,
    periodStart: resolvedPeriodStartMillis,
    statementBalance,
    statementDate: resolvedStatementDateMillis,
    reference,
    note,
  });

  const idempotencyRef = db.doc(
    `businesses/${businessId}/treasuryIdempotency/${idempotencyKey}`,
  );

  const statementDate = timestampFromMillis(resolvedStatementDateMillis);
  const periodStart = timestampFromMillis(resolvedPeriodStartMillis);

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

    const preview = await buildReconciliationPreview({
      bankAccountId,
      businessId,
      openingStatementBalance,
      periodStartMillis: resolvedPeriodStartMillis,
      resolvedStatementDateMillis,
      statementBalance,
      transaction,
    });
    if (preview.status !== 'balanced') {
      throw new HttpsError(
        'failed-precondition',
        `La conciliacion tiene una diferencia de ${preview.variance}. Resuelve la diferencia con un ajuste/write-off antes de cerrar el periodo.`,
      );
    }

    const reconciliationRef = db
      .collection(`businesses/${businessId}/bankReconciliations`)
      .doc();
    const statementLineRef = db
      .collection(`businesses/${businessId}/bankStatementLines`)
      .doc();
    const now = Timestamp.now();
    const reconciliationRecord = {
      id: reconciliationRef.id,
      businessId,
      bankAccountId,
      periodStart,
      periodEnd: statementDate,
      statementDate,
      openingStatementBalance,
      statementBalance,
      ledgerOpeningBalance: preview.ledgerOpeningBalance,
      ledgerPeriodMovementTotal: preview.ledgerPeriodMovementTotal,
      ledgerBalance: preview.ledgerBalance,
      reconciledMovementCount: preview.reconciledMovementCount,
      periodMovementCount: preview.periodMovementCount,
      carriedMovementCount: preview.carriedMovementCount,
      statementLineCount: 1,
      unreconciledMovementCount: preview.unreconciledMovementCount,
      statementMovementTotal: preview.statementMovementTotal,
      openingVariance: preview.openingVariance,
      periodVariance: preview.periodVariance,
      variance: preview.variance,
      status: preview.status,
      reference,
      notes: note,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      updatedBy: authUid,
      metadata: {
        idempotencyKey,
        sessionKind: 'period_close',
        statementLineId: statementLineRef.id,
      },
    };
    const statementLineRecord = {
      id: statementLineRef.id,
      businessId,
      bankAccountId,
      reconciliationId: reconciliationRef.id,
      lineType: 'closing_balance',
      status: 'reconciled',
      statementDate,
      amount: null,
      runningBalance: statementBalance,
      direction: null,
      description: note || 'Cierre manual de conciliación',
      reference,
      createdAt: now,
      createdBy: authUid,
      metadata: {
        idempotencyKey,
        openingStatementBalance,
        ledgerBalance: preview.ledgerBalance,
        ledgerOpeningBalance: preview.ledgerOpeningBalance,
        ledgerPeriodMovementTotal: preview.ledgerPeriodMovementTotal,
        periodEnd: statementDate,
        periodStart,
        periodVariance: preview.periodVariance,
        statementMovementTotal: preview.statementMovementTotal,
        variance: preview.variance,
      },
    };

    transaction.set(reconciliationRef, reconciliationRecord);
    transaction.set(statementLineRef, statementLineRecord);
    preview.periodMovementSnaps.forEach((movementSnap) => {
      const movementRecord = asRecord(movementSnap.data());
      const movementUpdate = {
        reconciliationId: reconciliationRef.id,
        reconciliationStatus: 'reconciled',
        reconciledAt: now,
      };
      if (!toCleanString(movementRecord.bankStatementLineId)) {
        movementUpdate.bankStatementLineId = statementLineRef.id;
      }
      transaction.set(
        db.doc(`businesses/${businessId}/cashMovements/${movementSnap.id}`),
        movementUpdate,
        { merge: true },
      );
    });
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
