import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
  resolvePilotMonetarySnapshotForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  assertAccountingPeriodOpenInTransaction,
} from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import {
  THRESHOLD,
  asRecord,
  buildIdempotencyRequestHash,
  buildPurchasePaymentState,
  normalizePaymentMethodsForAggregation,
  normalizeSupplierPaymentMethodCode,
  paymentMethodRequiresBankAccount,
  paymentMethodRequiresCashCount,
  resolvePaymentRecordBankAccountId,
  resolvePaymentRecordCashAccountId,
  resolvePaymentRecordCashCountId,
  resolvePaymentRecordReference,
  resolvePurchaseDocumentTotal,
  resolvePurchaseSupplierId,
  roundToTwoDecimals,
  safeNumber,
  sanitizeForResponse,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
  resolvePurchaseIdFromVendorBillRecord,
} from './vendorBill.shared.js';

const SUPPORTED_PAYMENT_METHODS = new Set([
  'cash',
  'card',
  'transfer',
  'supplierCreditNote',
]);

const normalizeRequestedPaymentMethods = (paymentMethods) => {
  if (!Array.isArray(paymentMethods)) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar al menos un método de pago.',
    );
  }

  const normalized = paymentMethods
    .map((entry) => {
      const methodRecord = asRecord(entry);
      const method = normalizeSupplierPaymentMethodCode(methodRecord.method);
      const amount = roundToTwoDecimals(
        methodRecord.value ?? methodRecord.amount,
      );
      if (!method || !SUPPORTED_PAYMENT_METHODS.has(method)) {
        throw new HttpsError(
          'invalid-argument',
          'Método de pago no soportado para proveedor.',
        );
      }
      if (amount <= THRESHOLD) {
        return null;
      }

      const normalizedEntry = {
        method,
        status: methodRecord.status !== false,
        value: amount,
        amount,
        reference: toCleanString(methodRecord.reference),
        bankAccountId: paymentMethodRequiresBankAccount(method)
          ? toCleanString(methodRecord.bankAccountId)
          : null,
        cashAccountId: paymentMethodRequiresCashCount(method)
          ? toCleanString(methodRecord.cashAccountId)
          : null,
        cashCountId: paymentMethodRequiresCashCount(method)
          ? toCleanString(methodRecord.cashCountId)
          : null,
        supplierCreditNoteId:
          method === 'supplierCreditNote'
            ? toCleanString(methodRecord.supplierCreditNoteId)
            : null,
      };

      if (!normalizedEntry.status) {
        return null;
      }

      return normalizedEntry;
    })
    .filter(Boolean);

  if (!normalized.length) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar al menos un método de pago con monto válido.',
    );
  }

  return normalized;
};

const validateMethodRequirements = ({ paymentMethods, accountingSettings }) => {
  const bankAccountsEnabled = accountingSettings?.bankAccountsEnabled !== false;

  paymentMethods.forEach((method) => {
    if (
      paymentMethodRequiresCashCount(method.method) &&
      !toCleanString(method.cashCountId)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Seleccione un cuadre abierto para el pago en efectivo.',
      );
    }

    if (
      paymentMethodRequiresBankAccount(method.method) &&
      !bankAccountsEnabled
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Los pagos con tarjeta o transferencia no estan habilitados para este negocio.',
      );
    }

    if (
      bankAccountsEnabled &&
      paymentMethodRequiresBankAccount(method.method) &&
      !toCleanString(method.bankAccountId)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Los pagos con tarjeta o transferencia requieren una cuenta bancaria activa.',
      );
    }

    if (
      method.method === 'supplierCreditNote' &&
      !toCleanString(method.supplierCreditNoteId)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Debe seleccionar una nota de crédito del suplidor.',
      );
    }
  });
};

const aggregateCreditNoteRequests = (paymentMethods) =>
  paymentMethods.reduce((accumulator, method) => {
    if (method.method !== 'supplierCreditNote') {
      return accumulator;
    }

    const noteId = toCleanString(method.supplierCreditNoteId);
    if (!noteId) {
      throw new HttpsError(
        'invalid-argument',
        'Debe seleccionar una nota de crédito del suplidor.',
      );
    }

    accumulator.set(
      noteId,
      roundToTwoDecimals((accumulator.get(noteId) || 0) + method.amount),
    );
    return accumulator;
  }, new Map());

const loadAndValidateSupportingDocuments = async ({
  businessId,
  paymentMethods,
  accountingSettings,
}) => {
  const bankAccountsEnabled = accountingSettings?.bankAccountsEnabled !== false;
  const uniqueCashCountIds = Array.from(
    new Set(
      paymentMethods
        .filter((method) => paymentMethodRequiresCashCount(method.method))
        .map((method) => toCleanString(method.cashCountId))
        .filter(Boolean),
    ),
  );
  const uniqueBankAccountIds = Array.from(
    new Set(
      paymentMethods
        .filter(
          (method) =>
            bankAccountsEnabled &&
            paymentMethodRequiresBankAccount(method.method),
        )
        .map((method) => toCleanString(method.bankAccountId))
        .filter(Boolean),
    ),
  );

  const [cashCountSnaps, bankAccountSnaps] = await Promise.all([
    Promise.all(
      uniqueCashCountIds.map((cashCountId) =>
        db.doc(`businesses/${businessId}/cashCounts/${cashCountId}`).get(),
      ),
    ),
    Promise.all(
      uniqueBankAccountIds.map((bankAccountId) =>
        db.doc(`businesses/${businessId}/bankAccounts/${bankAccountId}`).get(),
      ),
    ),
  ]);

  cashCountSnaps.forEach((snapshot) => {
    if (!snapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'El cuadre de caja seleccionado no existe.',
      );
    }
    const state = toCleanString(
      snapshot.data()?.cashCount?.state,
    )?.toLowerCase();
    if (state !== 'open') {
      throw new HttpsError(
        'failed-precondition',
        'El cuadre de caja seleccionado no está abierto.',
      );
    }
  });

  bankAccountSnaps.forEach((snapshot) => {
    if (!snapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta bancaria seleccionada no existe.',
      );
    }
    const status = toCleanString(snapshot.data()?.status)?.toLowerCase();
    if (status && status !== 'active') {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta bancaria seleccionada no está activa.',
      );
    }
  });

  return {
    cashAccountIdsByCashCountId: cashCountSnaps.reduce((accumulator, snapshot) => {
      accumulator[snapshot.id] =
        toCleanString(snapshot.data()?.cashAccountId) ??
        toCleanString(snapshot.data()?.cashCount?.cashAccountId) ??
        null;
      return accumulator;
    }, {}),
  };
};

const buildPaymentResponse = ({
  paymentRecord,
  paymentState,
  appliedCreditNotes,
  reused = false,
}) => ({
  ok: true,
  reused,
  paymentId: paymentRecord.id,
  purchaseId: paymentRecord.purchaseId ?? null,
  vendorBillId: paymentRecord.vendorBillId ?? null,
  receiptNumber: paymentRecord.receiptNumber ?? null,
  paymentState: sanitizeForResponse(paymentState),
  appliedCreditNotes: sanitizeForResponse(appliedCreditNotes),
  payment: sanitizeForResponse(paymentRecord),
});

export const addSupplierPayment = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const requestedPurchaseId = toCleanString(payload.purchaseId);
  const requestedVendorBillId = toCleanString(payload.vendorBillId);
  const idempotencyKey = toCleanString(payload.idempotencyKey);
  const note = toCleanString(payload.note);
  const requestedOccurredAtMillis = toMillis(payload.occurredAt);
  const requestedNextPaymentAtMillis = toMillis(payload.nextPaymentAt);
  const occurredAtMillis =
    typeof requestedOccurredAtMillis === 'number' &&
    Number.isFinite(requestedOccurredAtMillis) &&
    requestedOccurredAtMillis > 0
      ? Math.trunc(requestedOccurredAtMillis)
      : Date.now();
  const nextPaymentAtMillis =
    typeof requestedNextPaymentAtMillis === 'number' &&
    Number.isFinite(requestedNextPaymentAtMillis) &&
    requestedNextPaymentAtMillis > 0
      ? Math.trunc(requestedNextPaymentAtMillis)
      : null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!requestedPurchaseId && !requestedVendorBillId) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar purchaseId o vendorBillId.',
    );
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }

  const accountingSettings =
    await getPilotAccountingSettingsForBusiness(businessId);
  const accountingRolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
    accountingSettings,
  );
  if (!accountingRolloutEnabled) {
    throw new HttpsError(
      'failed-precondition',
      'El registro de pagos a suplidor no está habilitado para este negocio.',
    );
  }

  const paymentMethods = normalizeRequestedPaymentMethods(
    payload.paymentMethods,
  );
  const totalAmount = roundToTwoDecimals(
    paymentMethods.reduce((sum, method) => sum + method.amount, 0),
  );
  if (totalAmount <= THRESHOLD) {
    throw new HttpsError(
      'invalid-argument',
      'El monto del pago debe ser mayor que 0.',
    );
  }

  validateMethodRequirements({
    paymentMethods,
    accountingSettings,
  });

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_PAYABLE_PAYMENT,
  });
  const supportingDocuments = await loadAndValidateSupportingDocuments({
    businessId,
    paymentMethods,
    accountingSettings,
  });
  const normalizedPaymentMethods = paymentMethods.map((method) => ({
    ...method,
    cashAccountId:
      method.cashAccountId ??
      supportingDocuments.cashAccountIdsByCashCountId?.[method.cashCountId] ??
      null,
  }));

  const requestHash = buildIdempotencyRequestHash({
    businessId,
    purchaseId: requestedPurchaseId,
    vendorBillId: requestedVendorBillId,
    occurredAt: occurredAtMillis,
    nextPaymentAt: nextPaymentAtMillis,
    note,
    paymentMethods: normalizedPaymentMethods.map((method) => ({
      ...method,
      supplierCreditNoteId: toCleanString(method.supplierCreditNoteId),
    })),
  });

  const idempotencyRef = db.doc(
    `businesses/${businessId}/accountsPayablePaymentIdempotency/${idempotencyKey}`,
  );

  let result = null;

  await db.runTransaction(async (transaction) => {
    const vendorBillRef = requestedVendorBillId
      ? db.doc(`businesses/${businessId}/vendorBills/${requestedVendorBillId}`)
      : null;
    const [vendorBillSnap, idempotencySnap] = await Promise.all([
      vendorBillRef ? transaction.get(vendorBillRef) : Promise.resolve(null),
      transaction.get(idempotencyRef),
    ]);

    if (idempotencySnap.exists) {
      const idempotencyRecord = asRecord(idempotencySnap.data());
      const storedHash = toCleanString(idempotencyRecord.requestHash);
      if (storedHash && storedHash !== requestHash) {
        throw new HttpsError(
          'already-exists',
          'La llave de idempotencia ya fue utilizada con otro payload.',
        );
      }

      const existingPaymentId = toCleanString(idempotencyRecord.paymentId);
      if (!existingPaymentId) {
        throw new HttpsError(
          'failed-precondition',
          'El registro de idempotencia no apunta a un pago válido.',
        );
      }

      const existingPaymentRef = db.doc(
        `businesses/${businessId}/accountsPayablePayments/${existingPaymentId}`,
      );
      const existingPaymentSnap = await transaction.get(existingPaymentRef);
      if (!existingPaymentSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'El pago reutilizado por idempotencia ya no existe.',
        );
      }

      result = buildPaymentResponse({
        paymentRecord: {
          id: existingPaymentSnap.id,
          ...existingPaymentSnap.data(),
        },
        paymentState: existingPaymentSnap.data()?.paymentStateSnapshot ?? null,
        appliedCreditNotes:
          existingPaymentSnap.data()?.metadata?.appliedCreditNotes ?? [],
        reused: true,
      });
      return;
    }

    const resolvedVendorBillId =
      requestedVendorBillId ??
      buildCanonicalVendorBillIdFromPurchaseId(requestedPurchaseId);
    if (!resolvedVendorBillId) {
      throw new HttpsError(
        'failed-precondition',
        'No fue posible resolver la cuenta por pagar a pagar.',
      );
    }

    if (vendorBillRef && requestedVendorBillId && !vendorBillSnap?.exists) {
      throw new HttpsError('not-found', 'La cuenta por pagar no existe.');
    }

    const vendorBillRecord = vendorBillSnap?.exists
      ? asRecord(vendorBillSnap.data())
      : {};
    const purchaseId =
      requestedPurchaseId ??
      resolvePurchaseIdFromVendorBillRecord(vendorBillRecord, resolvedVendorBillId);
    if (!purchaseId) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar no está vinculada a una compra válida.',
      );
    }

    const purchaseRef = db.doc(
      `businesses/${businessId}/purchases/${purchaseId}`,
    );
    const purchaseSnap = await transaction.get(purchaseRef);
    if (!purchaseSnap.exists) {
      throw new HttpsError('not-found', 'La compra no existe.');
    }

    const purchaseRecord = asRecord(purchaseSnap.data());

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: occurredAtMillis,
      settings: accountingSettings,
      rolloutEnabled: true,
      operationLabel: 'registrar este pago a suplidor',
      createError: (message) =>
        new HttpsError('failed-precondition', message),
    });

    const purchaseStatus = toCleanString(
      purchaseRecord.workflowStatus ?? purchaseRecord.status,
    )?.toLowerCase();
    if (purchaseStatus === 'canceled') {
      throw new HttpsError(
        'failed-precondition',
        'No se puede registrar pago sobre una compra cancelada.',
      );
    }

    const supplierId = resolvePurchaseSupplierId(purchaseRecord);
    if (!supplierId) {
      throw new HttpsError(
        'failed-precondition',
        'La compra no tiene un suplidor válido.',
      );
    }

    const total = resolvePurchaseDocumentTotal(purchaseRecord);
    if (total <= THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'La compra no tiene un total válido para registrar pagos.',
      );
    }

    const paymentStateSnapshot = asRecord(purchaseRecord.paymentState);
    const paidBefore = roundToTwoDecimals(paymentStateSnapshot.paid ?? 0);
    const currentBalance = roundToTwoDecimals(
      paymentStateSnapshot.balance ?? total,
    );
    if (currentBalance <= THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'La compra no tiene balance pendiente.',
      );
    }
    if (totalAmount - currentBalance > THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'El pago no puede superar el balance actual de la compra.',
      );
    }

    const balanceAfter = roundToTwoDecimals(
      Math.max(currentBalance - totalAmount, 0),
    );
    if (balanceAfter > THRESHOLD && !nextPaymentAtMillis) {
      throw new HttpsError(
        'invalid-argument',
        'Debe indicar la próxima fecha de pago cuando el abono es parcial.',
      );
    }

    const paymentId = nanoid();
    const now = Timestamp.now();
    const occurredAt = Timestamp.fromMillis(occurredAtMillis);
    const nextPaymentAt =
      balanceAfter > THRESHOLD && nextPaymentAtMillis
        ? Timestamp.fromMillis(nextPaymentAtMillis)
        : null;
    const creditNoteRequests = aggregateCreditNoteRequests(normalizedPaymentMethods);
    const appliedCreditNotes = [];
    const creditNoteWrites = [];
    for (const [
      creditNoteId,
      requestedAmount,
    ] of creditNoteRequests.entries()) {
      const creditNoteRef = db.doc(
        `businesses/${businessId}/supplierCreditNotes/${creditNoteId}`,
      );
      const creditNoteSnap = await transaction.get(creditNoteRef);
      if (!creditNoteSnap.exists) {
        throw new HttpsError(
          'not-found',
          'La nota de crédito de suplidor no existe.',
        );
      }

      const creditNoteRecord = asRecord(creditNoteSnap.data());
      const creditSupplierId = toCleanString(creditNoteRecord.supplierId);
      if (!creditSupplierId || creditSupplierId !== supplierId) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de crédito no pertenece al suplidor de la compra.',
        );
      }

      const creditStatus = toCleanString(
        creditNoteRecord.status,
      )?.toLowerCase();
      if (creditStatus === 'void') {
        throw new HttpsError(
          'failed-precondition',
          'La nota de crédito seleccionada está anulada.',
        );
      }

      const creditTotal = roundToTwoDecimals(
        creditNoteRecord.totalAmount ??
          creditNoteRecord.amount ??
          creditNoteRecord.value,
      );
      const currentAppliedAmount = roundToTwoDecimals(
        creditNoteRecord.appliedAmount ??
          Math.max(
            creditTotal -
              roundToTwoDecimals(
                creditNoteRecord.remainingAmount ??
                  creditNoteRecord.balance ??
                  creditTotal,
              ),
            0,
          ),
      );
      const currentRemainingAmount = roundToTwoDecimals(
        creditNoteRecord.remainingAmount ??
          creditNoteRecord.balance ??
          Math.max(creditTotal - currentAppliedAmount, 0),
      );

      if (requestedAmount - currentRemainingAmount > THRESHOLD) {
        throw new HttpsError(
          'failed-precondition',
          'El saldo a favor disponible no es suficiente para este pago.',
        );
      }

      const nextAppliedAmount = roundToTwoDecimals(
        currentAppliedAmount + requestedAmount,
      );
      const nextRemainingAmount = roundToTwoDecimals(
        Math.max(creditTotal - nextAppliedAmount, 0),
      );

      appliedCreditNotes.push({
        id: creditNoteId,
        appliedAmount: requestedAmount,
        remainingAmount: nextRemainingAmount,
      });

      creditNoteWrites.push({
        ref: creditNoteRef,
        payload: {
          appliedAmount: nextAppliedAmount,
          remainingAmount: nextRemainingAmount,
          status: nextRemainingAmount <= THRESHOLD ? 'applied' : 'open',
          updatedAt: now,
          updatedBy: authUid,
          lastAppliedAt: occurredAt,
          lastAppliedPaymentId: paymentId,
        },
      });
    }

    const paymentMonetarySnapshot = await resolvePilotMonetarySnapshotForBusiness({
      businessId,
      source: purchaseRecord,
      operationType: 'payable-payment',
      totals: {
        total: totalAmount,
        paid: totalAmount,
        balance: 0,
      },
      capturedBy: authUid,
      capturedAt: occurredAt,
      settings: accountingSettings,
    });
    const paymentRecord = {
      id: paymentId,
      businessId,
      operationType: 'payable-payment',
      sourceId: resolvedVendorBillId,
      sourceDocumentId: resolvedVendorBillId,
      sourceDocumentType: 'vendorBill',
      counterpartyType: 'supplier',
      counterpartyId: supplierId,
      purchaseId,
      vendorBillId: resolvedVendorBillId,
      supplierId,
      paymentMethods: normalizedPaymentMethods,
      totalAmount,
      cashCountId: resolvePaymentRecordCashCountId(normalizedPaymentMethods),
      cashAccountId: resolvePaymentRecordCashAccountId(normalizedPaymentMethods),
      bankAccountId: resolvePaymentRecordBankAccountId(normalizedPaymentMethods),
      reference: resolvePaymentRecordReference(normalizedPaymentMethods),
      occurredAt,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      updatedBy: authUid,
      monetary: paymentMonetarySnapshot ?? null,
      exchangeRateSnapshot:
        paymentMonetarySnapshot?.exchangeRateSnapshot ?? null,
      paymentStateSnapshot: null,
      status: 'posted',
      receiptNumber: `CPP-${paymentId.slice(0, 8).toUpperCase()}`,
      nextPaymentAt,
      metadata: {
        purchaseNumber: purchaseRecord.numberId ?? null,
        purchaseStatus:
          toCleanString(
            purchaseRecord.workflowStatus ?? purchaseRecord.status,
          ) ?? null,
        vendorBillId: resolvedVendorBillId,
        note,
        idempotencyKey,
        appliedCreditNotes,
      },
    };

    const paymentCountBefore = Math.max(
      Math.trunc(safeNumber(paymentStateSnapshot.paymentCount) ?? 0),
      0,
    );
    const previousLastPaymentAt = paymentStateSnapshot.lastPaymentAt ?? null;
    const previousLastPaymentAtMillis = toMillis(previousLastPaymentAt);
    const isCurrentPaymentLatest =
      previousLastPaymentAtMillis == null ||
      occurredAtMillis >= previousLastPaymentAtMillis;
    const lastPaymentAt = isCurrentPaymentLatest
      ? occurredAt
      : previousLastPaymentAt;
    const lastPaymentId = isCurrentPaymentLatest
      ? paymentId
      : (toCleanString(paymentStateSnapshot.lastPaymentId) ?? paymentId);
    const resolvedNextPaymentAt =
      balanceAfter > THRESHOLD
        ? (isCurrentPaymentLatest
            ? (nextPaymentAt ??
              purchaseRecord.paymentTerms?.nextPaymentAt ??
              purchaseRecord.paymentTerms?.expectedPaymentAt ??
              null)
            : (purchaseRecord.paymentTerms?.nextPaymentAt ??
              purchaseRecord.paymentTerms?.expectedPaymentAt ??
              nextPaymentAt ??
              null))
        : null;
    const paymentState = buildPurchasePaymentState({
      purchaseRecord,
      total,
      paid: roundToTwoDecimals(paidBefore + totalAmount),
      paymentCount: paymentCountBefore + 1,
      lastPaymentAt,
      lastPaymentId,
      nextPaymentAt: resolvedNextPaymentAt,
    });
    paymentRecord.paymentStateSnapshot = paymentState;

    const paymentRef = db.doc(
      `businesses/${businessId}/accountsPayablePayments/${paymentId}`,
    );
    transaction.set(paymentRef, paymentRecord);
    transaction.set(
      purchaseRef,
      {
        paymentState,
        paymentTerms: {
          ...asRecord(purchaseRecord.paymentTerms),
          nextPaymentAt: resolvedNextPaymentAt,
        },
      },
      { merge: true },
    );
    const vendorBillProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord,
      paymentState,
      paymentTerms: {
        ...asRecord(purchaseRecord.paymentTerms),
        nextPaymentAt: resolvedNextPaymentAt,
      },
      vendorBillId: resolvedVendorBillId,
    });
    if (vendorBillProjection) {
      transaction.set(
        db.doc(`businesses/${businessId}/vendorBills/${resolvedVendorBillId}`),
        vendorBillProjection,
        { merge: true },
      );
    }
    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      paymentId,
      purchaseId,
      vendorBillId: resolvedVendorBillId,
      requestHash,
      createdAt: now,
      createdBy: authUid,
    });

    creditNoteWrites.forEach((entry) => {
      transaction.set(entry.ref, entry.payload, { merge: true });
    });

    result = buildPaymentResponse({
      paymentRecord,
      paymentState,
      appliedCreditNotes,
    });
  });

  return result;
});
