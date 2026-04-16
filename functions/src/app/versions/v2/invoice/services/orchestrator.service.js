import { addDays, addWeeks, addMonths } from 'date-fns';
import { https } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import { stableHash } from '../utils/hash.util.js';
import { assertUsageCanIncrease } from '../../billing/services/usage.service.js';
import {
  resolvePilotMonetarySnapshotForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../accounting/utils/accountingRollout.util.js';
import {
  assertAccountingPeriodOpenInTransaction,
  buildClosedPeriodInvoiceMessage,
  resolveInvoiceEffectiveDate,
} from '../../accounting/utils/periodClosure.util.js';

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

import { auditTx } from './audit.service.js';
import { getIdempotencyRef } from './idempotency.service.js';
import { reserveNcf } from './ncf.service.js';

const STRICT_LIMIT_PLANS = new Set(['demo', 'plus']);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const resolveSubscriptionFromBusinessData = (businessData) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(businessNode.subscription);
  if (Object.keys(rootSubscription).length > 0) return rootSubscription;
  if (Object.keys(nestedSubscription).length > 0) return nestedSubscription;
  return {};
};

/**
 * Crea una factura V2 en estado 'pending' y registra la clave de idempotencia.
 * No aplica efectos laterales aún (inventario, AR, etc.).
 */
export async function createPendingInvoice({
  businessId,
  userId,
  payload,
  idempotencyKey,
  cashCountId,
}) {
  const requestHash = stableHash(payload);
  const cartHash = stableHash(payload?.cart);

  const idempotencyRef = getIdempotencyRef(businessId, idempotencyKey);

  const { invoiceId, alreadyExists } = await db.runTransaction(async (tx) => {
    const idemSnap = await tx.get(idempotencyRef);
    if (idemSnap.exists) {
      const data = idemSnap.data();
      return { invoiceId: data.invoiceId, alreadyExists: true };
    }

    const monthKey = new Date().toISOString().slice(0, 7);
    const businessRef = db.doc(`businesses/${businessId}`);
    const accountingSettingsRef = db.doc(
      `businesses/${businessId}/settings/accounting`,
    );
    const taxReceiptSettingsRef = db.doc(
      `businesses/${businessId}/settings/taxReceipt`,
    );
    const usageCurrentRef = db.doc(`businesses/${businessId}/usage/current`);
    const usageMonthlyRef = db.doc(
      `businesses/${businessId}/usage/monthly/entries/${monthKey}`,
    );
    const rolloutEnabled = isAccountingRolloutEnabledForBusiness(businessId);
    const [
      businessSnap,
      usageCurrentSnap,
      usageMonthlySnap,
      accountingSettingsSnap,
      taxReceiptSettingsSnap,
    ] =
      await Promise.all([
        tx.get(businessRef),
        tx.get(usageCurrentRef),
        tx.get(usageMonthlyRef),
        rolloutEnabled ? tx.get(accountingSettingsRef) : Promise.resolve(null),
        tx.get(taxReceiptSettingsRef),
      ]);

    const businessData = businessSnap.exists ? businessSnap.data() || {} : {};
    const accountingSettingsData =
      rolloutEnabled && accountingSettingsSnap?.exists
        ? accountingSettingsSnap.data() || {}
        : {};
    const accountingEnabled = accountingSettingsData.generalAccountingEnabled === true;
    const taxReceiptSettingsData = taxReceiptSettingsSnap?.exists
      ? taxReceiptSettingsSnap.data() || {}
      : {};
    const businessRequiresFiscalReceipt =
      taxReceiptSettingsData.taxReceiptEnabled === true;

    await assertAccountingPeriodOpenInTransaction({
      transaction: tx,
      businessId,
      effectiveDate: resolveInvoiceEffectiveDate(payload),
      settings: accountingSettingsData,
      rolloutEnabled: rolloutEnabled && accountingEnabled,
      buildMessage: buildClosedPeriodInvoiceMessage,
      createError: (message) =>
        new https.HttpsError('failed-precondition', message),
    });

    const subscriptionSnapshot = resolveSubscriptionFromBusinessData(businessData);
    const planId =
      toCleanString(subscriptionSnapshot.planId)?.toLowerCase() || 'legacy';
    const currentUsageData = usageCurrentSnap.exists ? usageCurrentSnap.data() || {} : {};
    const monthlyUsageData = usageMonthlySnap.exists ? usageMonthlySnap.data() || {} : {};

    if (STRICT_LIMIT_PLANS.has(planId)) {
      const currentValue = Number(
        monthlyUsageData.monthlyInvoices ??
          currentUsageData.monthlyInvoices ??
          0,
      );
      assertUsageCanIncrease({
        subscription: subscriptionSnapshot,
        metricKey: 'monthlyInvoices',
        currentValue,
        incrementBy: 1,
        planId,
      });
    }

    const isPreorder = !!(
      payload?.preorder?.isPreorder ||
      payload?.cart?.preorderDetails?.isOrWasPreorder
    );
    const cartPayload = payload?.cart || {};
    const cartId = cartPayload?.id || null;
    const preorderCartId = isPreorder ? cartId : null;
    const newInvoiceId =
      preorderCartId || cartId || payload?.invoiceId || payload?.id || nanoid();
    const invoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${newInvoiceId}`,
    );

    // Derivar dueDate si no llega y hay configuración en billing
    const billing = payload?.cart?.billing || {};
    let derivedDueDate = payload?.dueDate || null;
    try {
      if (!derivedDueDate && billing?.hasDueDate) {
        let dt = new Date();
        const m = Number(billing?.duePeriod?.months || 0);
        const w = Number(billing?.duePeriod?.weeks || 0);
        const d = Number(billing?.duePeriod?.days || 0);
        if (m) dt = addMonths(dt, m);
        if (w) dt = addWeeks(dt, w);
        if (d) dt = addDays(dt, d);
        derivedDueDate = dt.getTime();
      }
    } catch {
      /* noop - due date derivation is best effort */
    }

    // Derivar invoiceComment desde productos si no llega
    let derivedInvoiceComment = payload?.invoiceComment || null;
    try {
      if (!derivedInvoiceComment && Array.isArray(payload?.cart?.products)) {
        const comments = payload.cart.products
          .filter((p) => p?.comment)
          .map((p) => `${p?.name || p?.id}: ${p.comment}`);
        if (comments.length) derivedInvoiceComment = comments.join('; ');
      }
    } catch {
      /* noop - comment aggregation is optional */
    }

    // Base doc
    const preferredCashCountId =
      cashCountId || payload?.cashCountId || payload?.cart?.cashCountId || null;
    const pilotMonetarySnapshot = rolloutEnabled
      ? await resolvePilotMonetarySnapshotForBusiness({
        businessId,
        monetary: payload?.cart?.monetary,
        source: payload?.cart,
        settings: accountingSettingsSnap?.exists
          ? accountingSettingsSnap.data()
          : null,
        totals: {
          subtotal: safeNumber(payload?.cart?.totalPurchaseWithoutTaxes?.value),
          taxes: safeNumber(payload?.cart?.totalTaxes?.value),
          total:
            safeNumber(payload?.cart?.totalPurchase?.value) ??
            safeNumber(payload?.cart?.totalAmount),
          paid:
            safeNumber(payload?.cart?.payment?.value) ??
            safeNumber(payload?.cart?.totalPaid),
        },
        capturedBy: userId,
      })
      : null;

    const canonicalCartPayload = payload?.cart ? { ...payload.cart } : {};
    if (newInvoiceId && !canonicalCartPayload.id) {
      canonicalCartPayload.id = newInvoiceId;
    }
    if (preferredCashCountId && !canonicalCartPayload.cashCountId) {
      canonicalCartPayload.cashCountId = preferredCashCountId;
    }
    if (pilotMonetarySnapshot) {
      canonicalCartPayload.monetary = pilotMonetarySnapshot;
    }

    const snapshotMeta = {
      preorder: isPreorder,
      preorderId: isPreorder ? preorderCartId || null : null,
    };
    if (preferredCashCountId) {
      snapshotMeta.cashCount = {
        intendedCashCountId: preferredCashCountId,
      };
    }

    const baseDoc = {
      version: 2,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      businessId,
      userId,
      idempotencyKey,
      requestHash,
      cartHash,
      statusTimeline: [{ status: 'pending', at: Timestamp.now() }],
      snapshot: {
        ncf: payload?.ncf || null,
        client: payload?.client || null,
        totals: payload?.cart?.payment || null,
        monetary: pilotMonetarySnapshot,
        meta: snapshotMeta,
        dueDate: derivedDueDate || null,
        invoiceComment: derivedInvoiceComment || null,
      },
    };

    // Opcional: reserva NCF en esta fase si está habilitado
    const ncfEnabled = !!(payload?.ncf?.enabled || payload?.taxReceiptEnabled);
    const ncfType = payload?.ncf?.type || payload?.ncfType;

    if (businessRequiresFiscalReceipt && !ncfEnabled) {
      throw new https.HttpsError(
        'failed-precondition',
        'Debes seleccionar un comprobante fiscal para completar la venta.',
        {
          reason: 'tax-receipt-required',
        },
      );
    }

    let ncfReservation = null;
    if (ncfEnabled) {
      if (!ncfType) {
        throw new https.HttpsError(
          'invalid-argument',
          'ncfType requerido cuando ncf.enabled=true',
          { reason: 'missing-ncf-type' },
        );
      }
      try {
        ncfReservation = await reserveNcf(tx, { businessId, userId, ncfType });
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : String(error || '');
        const normalizedMessage = rawMessage.toLowerCase();
        const isNcfUnavailable =
          normalizedMessage.includes('cantidad insuficiente') ||
          normalizedMessage.includes('no se pudo encontrar un ncf') ||
          normalizedMessage.includes('tipo de ncf no configurado') ||
          normalizedMessage.includes('serie de ncf no configurada');

        if (isNcfUnavailable) {
          throw new https.HttpsError(
            'failed-precondition',
            'No hay comprobantes disponibles para el tipo seleccionado',
            {
              reason: 'ncf-unavailable',
              ncfType,
              message: rawMessage,
            },
          );
        }

        throw error;
      }
      baseDoc.snapshot.ncf = {
        ...(baseDoc.snapshot.ncf || {}),
        type: ncfType,
        code: ncfReservation.ncfCode,
        usageId: ncfReservation.usageId,
        status: 'reserved',
      };
      baseDoc.statusTimeline.push({
        status: 'ncf_reserved',
        at: Timestamp.now(),
      });
    }

    tx.set(invoiceRef, baseDoc);
    auditTx(tx, {
      businessId,
      invoiceId: newInvoiceId,
      event: 'invoice_init',
      data: { idempotencyKey, ncfReserved: !!ncfReservation, cartHash },
    });

    // Crear tarea de outbox: actualizar inventario (Fase 3)
    const taskId = nanoid();
    const outboxRef = db.doc(
      `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${taskId}`,
    );
    const products = Array.isArray(payload?.cart?.products)
      ? payload.cart.products.map((p) => ({
        id: p.id,
        name: p.name,
        amountToBuy: p.amountToBuy,
        trackInventory: !!p.trackInventory,
        productStockId: p.productStockId,
        batchId: p.batchId,
      }))
      : [];

    tx.set(outboxRef, {
      id: taskId,
      type: 'updateInventory',
      status: 'pending',
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      payload: {
        businessId,
        userId,
        products,
      },
    });
    auditTx(tx, {
      businessId,
      invoiceId: newInvoiceId,
      event: 'task_scheduled',
      data: { type: 'updateInventory', products: { count: products.length } },
    });

    // Crear tarea de outbox: crear factura canónica (Fase 7)
    const canonTaskId = nanoid();
    const canonOutboxRef = db.doc(
      `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${canonTaskId}`,
    );
    tx.set(canonOutboxRef, {
      id: canonTaskId,
      type: 'createCanonicalInvoice',
      status: 'pending',
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      payload: {
        businessId,
        userId,
        cart: canonicalCartPayload,
        client: payload?.client || null,
        dueDate: derivedDueDate || null,
        invoiceComment: derivedInvoiceComment || null,
        preferredCashCountId,
      },
    });
    auditTx(tx, {
      businessId,
      invoiceId: newInvoiceId,
      event: 'task_scheduled',
      data: { type: 'createCanonicalInvoice' },
    });

    // Crear tarea de outbox: attach a cash count abierto (Fase 7)
    const ccTaskId = nanoid();
    const ccOutboxRef = db.doc(
      `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${ccTaskId}`,
    );
    tx.set(ccOutboxRef, {
      id: ccTaskId,
      type: 'attachToCashCount',
      status: 'pending',
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      payload: {
        businessId,
        userId,
        preferredCashCountId,
      },
    });
    auditTx(tx, {
      businessId,
      invoiceId: newInvoiceId,
      event: 'task_scheduled',
      data: { type: 'attachToCashCount' },
    });

    // Crear tarea de outbox: cerrar preorden (Fase Preorden)
    if (isPreorder) {
      const prTaskId = nanoid();
      const prOutboxRef = db.doc(
        `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${prTaskId}`,
      );
      tx.set(prOutboxRef, {
        id: prTaskId,
        type: 'closePreorder',
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        payload: {
          businessId,
          userId,
        },
      });
      auditTx(tx, {
        businessId,
        invoiceId: newInvoiceId,
        event: 'task_scheduled',
        data: { type: 'closePreorder' },
      });
    }

    // Crear tarea de outbox: setupAR (Fase 4)
    const isAddedToReceivables = !!payload?.cart?.isAddedToReceivables;
    const arData = payload?.accountsReceivable || null;
    if (isAddedToReceivables) {
      const totalInstallments = Number(arData?.totalInstallments);
      if (
        !arData ||
        !Number.isFinite(totalInstallments) ||
        totalInstallments <= 0
      ) {
        throw new https.HttpsError(
          'invalid-argument',
          'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true',
          { reason: 'invalid-accounts-receivable' },
        );
      }
    }
    if (
      isAddedToReceivables &&
      arData &&
      Number(arData?.totalInstallments) > 0
    ) {
      const arTaskId = nanoid();
      const arOutboxRef = db.doc(
        `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${arTaskId}`,
      );
      const nowMs = Date.now();
      tx.set(arOutboxRef, {
        id: arTaskId,
        type: 'setupAR',
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        payload: {
          businessId,
          userId,
          ar: {
            ...arData,
            createdAt: arData.createdAt || nowMs,
            updatedAt: arData.updatedAt || nowMs,
          },
          clientId: payload?.client?.id || null,
        },
      });
      auditTx(tx, {
        businessId,
        invoiceId: newInvoiceId,
        event: 'task_scheduled',
        data: { type: 'setupAR' },
      });
    }

    // Crear tarea de outbox: consumeCreditNotes (Fase 4)
    const creditNotes = Array.isArray(payload?.cart?.creditNotePayment)
      ? payload.cart.creditNotePayment
      : [];
    if (creditNotes.length > 0) {
      const cnTaskId = nanoid();
      const cnOutboxRef = db.doc(
        `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${cnTaskId}`,
      );
      tx.set(cnOutboxRef, {
        id: cnTaskId,
        type: 'consumeCreditNotes',
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        payload: {
          businessId,
          userId,
          creditNotes: creditNotes.map((cn) => ({
            id: cn.id,
            ncf: cn.ncf || null,
            amountUsed: Number(cn.amountUsed) || 0,
            originalAmount: Number(cn.originalAmount) || null,
          })),
        },
      });
      auditTx(tx, {
        businessId,
        invoiceId: newInvoiceId,
        event: 'task_scheduled',
        data: {
          type: 'consumeCreditNotes',
          creditNotes: { count: creditNotes.length },
        },
      });
    }

    // Crear tarea de outbox: setupInsuranceAR (Fase 9)
    const insuranceEnabled = !!payload?.insuranceEnabled;
    const insuranceAR = payload?.insuranceAR || null;
    const insuranceAuth = payload?.insuranceAuth || null;
    if (
      insuranceEnabled &&
      insuranceAR &&
      Number(insuranceAR?.totalInstallments) > 0 &&
      insuranceAuth?.insuranceId
    ) {
      const insTaskId = nanoid();
      const insOutboxRef = db.doc(
        `businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${insTaskId}`,
      );
      const nowMs = Date.now();
      tx.set(insOutboxRef, {
        id: insTaskId,
        type: 'setupInsuranceAR',
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        payload: {
          businessId,
          userId,
          clientId: payload?.client?.id || null,
          insuranceEnabled: true,
          insuranceAR: {
            ...insuranceAR,
            createdAt: insuranceAR.createdAt || nowMs,
            updatedAt: insuranceAR.updatedAt || nowMs,
          },
          insuranceAuth: insuranceAuth,
        },
      });
    }

    tx.set(idempotencyRef, {
      key: idempotencyKey,
      invoiceId: newInvoiceId,
      payloadHash: requestHash,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const nextCurrentMonthlyInvoices =
      Number(currentUsageData.monthlyInvoices || 0) + 1;
    const nextMonthMonthlyInvoices =
      Number(monthlyUsageData.monthlyInvoices || 0) + 1;

    tx.set(
      usageCurrentRef,
      {
        businessId,
        monthKey,
        monthlyInvoices: nextCurrentMonthlyInvoices,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(
      usageMonthlyRef,
      {
        businessId,
        month: monthKey,
        monthlyInvoices: nextMonthMonthlyInvoices,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { invoiceId: newInvoiceId, alreadyExists: false };
  });

  return { invoiceId, status: 'pending', alreadyExists };
}
