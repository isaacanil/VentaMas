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

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

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

const normalizeLedger = (value) => {
  const record = asRecord(value);
  const type = toCleanString(record.type)?.toLowerCase() || null;
  if (!type || !['cash', 'bank'].includes(type)) {
    return null;
  }

  return {
    type,
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

  if (ledger.type === 'cash' && !ledger.cashCountId) {
    throw new HttpsError(
      'invalid-argument',
      `El ledger ${role} de tipo cash requiere cashCountId.`,
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
  const amount = roundToTwoDecimals(payload.amount);
  const reference = toCleanString(payload.reference);
  const note = toCleanString(payload.note);
  const fromLedger = normalizeLedger(payload.from);
  const toLedger = normalizeLedger(payload.to);

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
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

  assertValidLedger(fromLedger, 'from');
  assertValidLedger(toLedger, 'to');

  const fromIdentity =
    fromLedger.type === 'cash' ? fromLedger.cashCountId : fromLedger.bankAccountId;
  const toIdentity =
    toLedger.type === 'cash' ? toLedger.cashCountId : toLedger.bankAccountId;
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

  const transferId = nanoid();
  const now = Timestamp.now();
  const transferRef = db.doc(
    `businesses/${businessId}/internalTransfers/${transferId}`,
  );
  let result = null;

  await db.runTransaction(async (transaction) => {
    const cashRefs = [fromLedger, toLedger]
      .filter((ledger) => ledger.type === 'cash')
      .map((ledger) =>
        db.doc(`businesses/${businessId}/cashCounts/${ledger.cashCountId}`),
      );
    const bankRefs = [fromLedger, toLedger]
      .filter((ledger) => ledger.type === 'bank')
      .map((ledger) =>
        db.doc(`businesses/${businessId}/bankAccounts/${ledger.bankAccountId}`),
      );

    const [cashSnaps, bankSnaps] = await Promise.all([
      Promise.all(cashRefs.map((ref) => transaction.get(ref))),
      Promise.all(bankRefs.map((ref) => transaction.get(ref))),
    ]);

    cashSnaps.forEach((snap) => {
      if (!snap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Una de las cajas seleccionadas ya no existe.',
        );
      }
      const state =
        toCleanString(snap.get('cashCount.state'))?.toLowerCase() || 'closed';
      if (state !== 'open') {
        throw new HttpsError(
          'failed-precondition',
          'Las cajas involucradas en la transferencia deben estar abiertas.',
        );
      }
    });

    bankSnaps.forEach((snap) => {
      if (!snap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Una de las cuentas bancarias seleccionadas ya no existe.',
        );
      }
    });

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: now,
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
      reference,
      note,
      from: fromLedger,
      to: toLedger,
      occurredAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      updatedBy: authUid,
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
      occurredAt: now,
      recordedAt: now,
      createdAt: now,
      createdBy: authUid,
    });

    transaction.set(
      db.doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`),
      accountingEvent,
    );

    result = {
      ok: true,
      businessId,
      transfer: sanitizeForResponse(transferRecord),
      movements: sanitizeForResponse(movements),
    };
  });

  return result;
});
