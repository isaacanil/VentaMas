import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { buildInternalTransferCashMovements } from '../../../versions/v2/accounting/utils/cashMovement.util.js';
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

const resolveMovementSignedAmount = (movementRecord) => {
  const amount = roundToTwoDecimals(movementRecord.amount);
  return movementRecord.direction === 'out' ? -amount : amount;
};

const isMovementPosted = (movementRecord) => {
  const normalizedStatus = toCleanString(movementRecord?.status)?.toLowerCase();
  return normalizedStatus !== 'void' && normalizedStatus !== 'draft';
};

const resolveLedgerAccountId = (ledger) =>
  ledger?.type === 'cash'
    ? toCleanString(ledger.cashAccountId ?? ledger.cashCountId)
    : toCleanString(ledger?.bankAccountId);

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

const buildLedgerBalanceQuery = ({ businessId, ledger }) => {
  const cashMovementsCollection = db.collection(
    `businesses/${businessId}/cashMovements`,
  );

  if (ledger.type === 'bank') {
    return cashMovementsCollection.where('bankAccountId', '==', ledger.bankAccountId);
  }

  const cashAccountId = resolveLedgerAccountId(ledger);
  return cashMovementsCollection.where('cashAccountId', '==', cashAccountId);
};

const calculateLedgerBalanceThroughDate = async ({
  businessId,
  ledger,
  openingBalance,
  occurredAtMillis,
  transaction,
}) => {
  const query = buildLedgerBalanceQuery({
    businessId,
    ledger,
  });
  const cashMovementsSnap = transaction
    ? await transaction.get(query)
    : await query.get();

  return roundToTwoDecimals(
    roundToTwoDecimals(openingBalance) +
      cashMovementsSnap.docs.reduce((sum, movementSnap) => {
        const movementRecord = asRecord(movementSnap.data());
        if (!isMovementPosted(movementRecord)) {
          return sum;
        }

        const movementMillis = toMillis(
          movementRecord.occurredAt ?? movementRecord.createdAt,
        );
        if (movementMillis != null && movementMillis > occurredAtMillis) {
          return sum;
        }

        return sum + resolveMovementSignedAmount(movementRecord);
      }, 0),
  );
};

const normalizeLedger = (value) => {
  const record = asRecord(value);
  const type = toCleanString(record.type)?.toLowerCase() || null;
  if (!type || !['cash', 'bank'].includes(type)) {
    return null;
  }

  return {
    type,
    cashAccountId: toCleanString(record.cashAccountId),
    cashCountId: toCleanString(record.cashCountId),
    bankAccountId: toCleanString(record.bankAccountId),
  };
};

const resolveTransferPaymentChannel = (fromLedger, toLedger) => {
  const types = new Set([fromLedger?.type, toLedger?.type].filter(Boolean));
  if (types.size > 1) return 'mixed';
  if (types.has('bank')) return 'bank';
  if (types.has('cash')) return 'cash';
  return null;
};

const assertValidLedger = (ledger, role) => {
  if (!ledger) {
    throw new HttpsError(
      'invalid-argument',
      `El ledger ${role} es requerido y debe ser cash o bank.`,
    );
  }

  if (ledger.type === 'cash' && !resolveLedgerAccountId(ledger)) {
    throw new HttpsError(
      'invalid-argument',
      `El ledger ${role} de tipo cash requiere cashAccountId.`,
    );
  }
  if (ledger.type === 'bank' && !ledger.bankAccountId) {
    throw new HttpsError(
      'invalid-argument',
      `El ledger ${role} de tipo bank requiere bankAccountId.`,
    );
  }
};

export const createInternalTransfer = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const idempotencyKey = toCleanString(payload.idempotencyKey);
  const amount = roundToTwoDecimals(payload.amount);
  const currency = toCleanString(payload.currency);
  const reference = toCleanString(payload.reference);
  const note = toCleanString(payload.note);
  const allowOverdraft = payload.allowOverdraft === true;
  const occurredAtMillis = toMillis(payload.occurredAt);
  const fromLedger = normalizeLedger(payload.from);
  const toLedger = normalizeLedger(payload.to);

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }
  if (!isAccountingRolloutEnabledForBusiness(businessId)) {
    throw new HttpsError(
      'failed-precondition',
      'Las transferencias internas solo están habilitadas en negocios del piloto contable.',
    );
  }
  if (amount <= 0) {
    throw new HttpsError('invalid-argument', 'El monto debe ser mayor que 0.');
  }
  if (payload.occurredAt != null && occurredAtMillis == null) {
    throw new HttpsError(
      'invalid-argument',
      'occurredAt debe ser una fecha válida.',
    );
  }

  assertValidLedger(fromLedger, 'from');
  assertValidLedger(toLedger, 'to');
  const resolvedOccurredAtMillis = occurredAtMillis ?? Date.now();
  const occurredAt = timestampFromMillis(resolvedOccurredAtMillis);

  const fromIdentity = resolveLedgerAccountId(fromLedger);
  const toIdentity = resolveLedgerAccountId(toLedger);
  if (fromLedger.type === toLedger.type && fromIdentity === toIdentity) {
    throw new HttpsError(
      'invalid-argument',
      'La transferencia interna requiere origen y destino distintos.',
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
  const accountingSettings =
    await getPilotAccountingSettingsForBusiness(businessId);
  const requestHash = buildTreasuryIdempotencyRequestHash({
    businessId,
    amount,
    currency,
    occurredAt: resolvedOccurredAtMillis,
    reference,
    note,
    from: {
      type: fromLedger.type,
      cashAccountId: fromLedger.cashAccountId ?? null,
      cashCountId: fromLedger.cashCountId ?? null,
      bankAccountId: fromLedger.bankAccountId ?? null,
    },
    to: {
      type: toLedger.type,
      cashAccountId: toLedger.cashAccountId ?? null,
      cashCountId: toLedger.cashCountId ?? null,
      bankAccountId: toLedger.bankAccountId ?? null,
    },
  });

  const transferId = nanoid();
  const now = Timestamp.now();
  const transferRef = db.doc(
    `businesses/${businessId}/internalTransfers/${transferId}`,
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

      const existingTransferId = toCleanString(idempotencyRecord.transferId);
      if (!existingTransferId) {
        throw new HttpsError(
          'failed-precondition',
          'El registro de idempotencia no apunta a una transferencia válida.',
        );
      }

      const existingTransferRef = db.doc(
        `businesses/${businessId}/internalTransfers/${existingTransferId}`,
      );
      const existingTransferSnap = await transaction.get(existingTransferRef);
      if (!existingTransferSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La transferencia reutilizada por idempotencia ya no existe.',
        );
      }

      result = {
        ok: true,
        reused: true,
        businessId,
        transfer: sanitizeForResponse({
          id: existingTransferSnap.id,
          ...existingTransferSnap.data(),
        }),
      };
      return;
    }

    const fromLedgerRef =
      fromLedger.type === 'cash'
        ? db.doc(
            `businesses/${businessId}/cashAccounts/${resolveLedgerAccountId(fromLedger)}`,
          )
        : db.doc(
            `businesses/${businessId}/bankAccounts/${fromLedger.bankAccountId}`,
          );
    const toLedgerRef =
      toLedger.type === 'cash'
        ? db.doc(
            `businesses/${businessId}/cashAccounts/${resolveLedgerAccountId(toLedger)}`,
          )
        : db.doc(`businesses/${businessId}/bankAccounts/${toLedger.bankAccountId}`);

    const [fromLedgerSnap, toLedgerSnap] = await Promise.all([
      transaction.get(fromLedgerRef),
      transaction.get(toLedgerRef),
    ]);

    [
      { role: 'origen', snap: fromLedgerSnap },
      { role: 'destino', snap: toLedgerSnap },
    ].forEach(({ role, snap }) => {
      if (!snap.exists) {
        throw new HttpsError(
          'failed-precondition',
          `La cuenta de ${role} seleccionada ya no existe.`,
        );
      }
      const status = toCleanString(snap.get('status'))?.toLowerCase() || 'inactive';
      if (status !== 'active') {
        throw new HttpsError(
          'failed-precondition',
          `La cuenta de ${role} debe estar activa para registrar la transferencia.`,
        );
      }
    });

    const fromCurrency = toCleanString(fromLedgerSnap.get('currency'));
    const toCurrency = toCleanString(toLedgerSnap.get('currency'));
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      throw new HttpsError(
        'failed-precondition',
        'La transferencia interna requiere cuentas de la misma moneda.',
      );
    }
    if (currency && fromCurrency && currency !== fromCurrency) {
      throw new HttpsError(
        'failed-precondition',
        'La moneda indicada no coincide con la cuenta de origen.',
      );
    }
    if (currency && toCurrency && currency !== toCurrency) {
      throw new HttpsError(
        'failed-precondition',
        'La moneda indicada no coincide con la cuenta de destino.',
      );
    }
    const transferCurrency = currency ?? fromCurrency ?? toCurrency ?? null;
    const sourceCurrentBalance = await calculateLedgerBalanceThroughDate({
      businessId,
      ledger: fromLedger,
      openingBalance: safeNumber(fromLedgerSnap.get('openingBalance')),
      occurredAtMillis: resolvedOccurredAtMillis,
      transaction,
    });
    const sourceProjectedBalance = roundToTwoDecimals(sourceCurrentBalance - amount);

    if (sourceProjectedBalance < 0 && !allowOverdraft) {
      throw new HttpsError(
        'failed-precondition',
        'La transferencia deja saldo negativo en la cuenta origen. Reduce el monto o autoriza sobregiro explícitamente.',
      );
    }

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: occurredAt,
      settings: accountingSettings,
      rolloutEnabled: true,
      operationLabel: 'registrar esta transferencia interna',
      createError: (message) =>
        new HttpsError('failed-precondition', message),
    });

    const transferRecord = {
      id: transferId,
      businessId,
      status: 'posted',
      amount,
      currency: transferCurrency,
      fromAccountId: fromIdentity,
      fromAccountType: fromLedger.type,
      toAccountId: toIdentity,
      toAccountType: toLedger.type,
      reference,
      note,
      from: fromLedger,
      to: toLedger,
      occurredAt,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      updatedBy: authUid,
      metadata: {
        allowOverdraft,
        idempotencyKey,
        sourceCurrentBalance,
        sourceProjectedBalance,
      },
    };
    const movements = buildInternalTransferCashMovements({
      businessId,
      transfer: transferRecord,
      createdAt: now,
      createdBy: authUid,
    });
    if (movements.length !== 2) {
      throw new HttpsError(
        'failed-precondition',
        'No se pudieron construir los movimientos de tesorería de la transferencia.',
      );
    }

    transaction.set(transferRef, transferRecord);
    movements.forEach((movement) => {
      transaction.set(
        db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
        movement,
      );
    });

    const accountingEvent = buildAccountingEvent({
      businessId,
      eventType: 'internal_transfer.posted',
      sourceType: 'internalTransfer',
      sourceId: transferId,
      sourceDocumentType: 'internalTransfer',
      sourceDocumentId: transferId,
      monetary: {
        amount,
        functionalAmount: amount,
      },
      treasury: {
        cashCountId:
          fromLedger.type === 'cash'
            ? fromLedger.cashCountId
            : toLedger.type === 'cash'
              ? toLedger.cashCountId
              : null,
        cashAccountId:
          fromLedger.type === 'cash'
            ? fromLedger.cashAccountId ?? fromIdentity
            : toLedger.type === 'cash'
              ? toLedger.cashAccountId ?? toIdentity
              : null,
        bankAccountId:
          fromLedger.type === 'bank'
            ? fromLedger.bankAccountId
            : toLedger.type === 'bank'
              ? toLedger.bankAccountId
              : null,
        paymentChannel: resolveTransferPaymentChannel(fromLedger, toLedger),
      },
      payload: {
        reference,
        note,
        from: fromLedger,
        to: toLedger,
      },
      occurredAt,
      recordedAt: now,
      createdAt: now,
      createdBy: authUid,
      idempotencyKey,
    });

    transaction.set(
      db.doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`),
      accountingEvent,
    );
    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      command: 'createInternalTransfer',
      requestHash,
      transferId,
      sourceDocumentType: 'internal_transfer',
      sourceDocumentId: transferId,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      responseSnapshot: {
        ok: true,
        reused: false,
        businessId,
        transfer: sanitizeForResponse(transferRecord),
        movements: sanitizeForResponse(movements),
      },
    });

    result = {
      ok: true,
      reused: false,
      businessId,
      transfer: sanitizeForResponse(transferRecord),
      movements: sanitizeForResponse(movements),
    };
  });

  return result;
});
