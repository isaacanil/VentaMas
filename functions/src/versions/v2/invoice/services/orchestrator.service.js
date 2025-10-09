import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import { https } from 'firebase-functions';
import { nanoid } from 'nanoid';
import { stableHash } from '../utils/hash.util.js';
import { getIdempotencyRef } from './idempotency.service.js';
import { reserveNcf } from './ncf.service.js';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { auditTx } from './audit.service.js';

/**
 * Crea una factura V2 en estado 'pending' y registra la clave de idempotencia.
 * No aplica efectos laterales aún (inventario, AR, etc.).
 */
export async function createPendingInvoice({ businessId, userId, payload, idempotencyKey }) {
  const requestHash = stableHash(payload);
  const cartHash = stableHash(payload?.cart);

  const idempotencyRef = getIdempotencyRef(businessId, idempotencyKey);

  const { invoiceId, alreadyExists } = await db.runTransaction(async (tx) => {
    const idemSnap = await tx.get(idempotencyRef);
    if (idemSnap.exists) {
      const data = idemSnap.data();
      return { invoiceId: data.invoiceId, alreadyExists: true };
    }

    const isPreorder =
      !!(payload?.preorder?.isPreorder || payload?.cart?.preorderDetails?.isOrWasPreorder);
    const preorderCartId = isPreorder
      ? (
        payload?.cart?.id
        || payload?.cart?.cartId
        || payload?.cart?.cartIdRef
        || payload?.cartId
        || null
      )
      : null;
    const newInvoiceId = preorderCartId || nanoid();
    const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}`);

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
    } catch {}

    // Derivar invoiceComment desde productos si no llega
    let derivedInvoiceComment = payload?.invoiceComment || null;
    try {
      if (!derivedInvoiceComment && Array.isArray(payload?.cart?.products)) {
        const comments = payload.cart.products
          .filter((p) => p?.comment)
          .map((p) => `${p?.name || p?.id}: ${p.comment}`);
        if (comments.length) derivedInvoiceComment = comments.join('; ');
      }
    } catch {}

    // Base doc
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
      statusTimeline: [
        { status: 'pending', at: Timestamp.now() },
      ],
      snapshot: {
        ncf: payload?.ncf || null,
        client: payload?.client || null,
        totals: payload?.cart?.payment || null,
        meta: {
          preorder: isPreorder,
          preorderId: isPreorder ? (preorderCartId || null) : null,
        },
        dueDate: derivedDueDate || null,
        invoiceComment: derivedInvoiceComment || null,
      },
    };

    // Opcional: reserva NCF en esta fase si está habilitado
    const ncfEnabled = !!(payload?.ncf?.enabled || payload?.taxReceiptEnabled);
    const ncfType = payload?.ncf?.type || payload?.ncfType;
    let ncfReservation = null;
    if (ncfEnabled) {
      if (!ncfType) {
        throw new https.HttpsError('invalid-argument', 'ncfType requerido cuando ncf.enabled=true', { reason: 'missing-ncf-type' });
      }
      ncfReservation = await reserveNcf(tx, { businessId, userId, ncfType });
      baseDoc.snapshot.ncf = {
        ...(baseDoc.snapshot.ncf || {}),
        type: ncfType,
        code: ncfReservation.ncfCode,
        usageId: ncfReservation.usageId,
        status: 'reserved',
      };
      baseDoc.statusTimeline.push({ status: 'ncf_reserved', at: Timestamp.now() });
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
    const outboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${taskId}`);
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
    const canonOutboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${canonTaskId}`);
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
        cart: payload?.cart || {},
        client: payload?.client || null,
        dueDate: derivedDueDate || null,
        invoiceComment: derivedInvoiceComment || null,
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
    const ccOutboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${ccTaskId}`);
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
      const prOutboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${prTaskId}`);
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
      if (!arData || !Number.isFinite(totalInstallments) || totalInstallments <= 0) {
        throw new https.HttpsError('invalid-argument', 'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true', { reason: 'invalid-accounts-receivable' });
      }
    }
    if (isAddedToReceivables && arData && Number(arData?.totalInstallments) > 0) {
      const arTaskId = nanoid();
      const arOutboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${arTaskId}`);
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
    const creditNotes = Array.isArray(payload?.cart?.creditNotePayment) ? payload.cart.creditNotePayment : [];
    if (creditNotes.length > 0) {
      const cnTaskId = nanoid();
      const cnOutboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${cnTaskId}`);
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
          creditNotes: creditNotes.map(cn => ({
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
        data: { type: 'consumeCreditNotes', creditNotes: { count: creditNotes.length } },
      });
    }

    // Crear tarea de outbox: setupInsuranceAR (Fase 9)
    const insuranceEnabled = !!payload?.insuranceEnabled;
    const insuranceAR = payload?.insuranceAR || null;
    const insuranceAuth = payload?.insuranceAuth || null;
    if (insuranceEnabled && insuranceAR && Number(insuranceAR?.totalInstallments) > 0 && insuranceAuth?.insuranceId) {
      const insTaskId = nanoid();
      const insOutboxRef = db.doc(`businesses/${businessId}/invoicesV2/${newInvoiceId}/outbox/${insTaskId}`);
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

    return { invoiceId: newInvoiceId, alreadyExists: false };
  });

  return { invoiceId, status: 'pending', alreadyExists };
}

