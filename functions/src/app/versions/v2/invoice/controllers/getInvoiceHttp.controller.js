import { https, logger } from 'firebase-functions';

import { db } from '../../../../core/config/firebase.js';
import {
  resolveHttpAuthUser,
  HttpAuthError,
} from '../../auth/services/httpAuth.service.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';
import { handleHttpCorsPreflightAndMethod } from '../../http/httpCors.util.js';
import { mapHttpsErrorToHttpStatus } from '../../http/httpError.util.js';

const normalizeDocRefPath = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.path === 'string' && value.path.trim()) {
    return value.path.trim();
  }
  if (
    value.id &&
    typeof value.id === 'string' &&
    value.parent &&
    typeof value.parent.path === 'string'
  ) {
    return `${value.parent.path}/${value.id}`;
  }
  if (
    typeof value === 'object' &&
    value.segments &&
    Array.isArray(value.segments)
  ) {
    return value.segments.join('/');
  }
  return null;
};

const hasInvoiceInSales = (sales, invoicePath, invoiceId) => {
  if (!Array.isArray(sales)) return false;
  return sales.some((entry) => {
    if (!entry) return false;
    const entryPath = normalizeDocRefPath(entry);
    if (entryPath && invoicePath) {
      return entryPath === invoicePath;
    }
    const entryId =
      (typeof entry.id === 'string' && entry.id.trim()) ||
      (typeof entry.invoiceId === 'string' && entry.invoiceId.trim()) ||
      null;
    return entryId ? entryId === invoiceId : false;
  });
};

const normalizeCashCountCandidate = (candidate) => {
  if (!candidate) return null;
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed || null;
  }
  if (typeof candidate.path === 'string') {
    const segments = candidate.path.split('/');
    return segments[segments.length - 1] || null;
  }
  if (typeof candidate.id === 'string') {
    const trimmed = candidate.id.trim();
    return trimmed || null;
  }
  return null;
};

const MAX_CASH_COUNT_SCAN = 50;

const mapCashCountDoc = (docSnap) => {
  const data = docSnap.data() || {};
  const cc = data.cashCount || {};
  return {
    id: docSnap.id,
    state: cc.state || null,
    number: cc.number || cc.cashCountNumber || null,
    opening: cc.opening || null,
    closing: cc.closing || null,
    totals: cc.summary || null,
    raw: cc,
  };
};

const mapTimelineEventDoc = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    status: data.status || null,
    at: data.at || data.createdAt || null,
    type: data.type || null,
    source: data.source || null,
    taskId: data.taskId || null,
    metadata: data.metadata || null,
  };
};

export const getInvoiceV2Http = https.onRequest(async (req, res) => {
  const httpGuardHandled = handleHttpCorsPreflightAndMethod(req, res, {
    allowedMethod: 'GET',
    methods: 'GET, OPTIONS',
    headers: 'Content-Type, Authorization, X-Session-Token',
  });
  if (httpGuardHandled) {
    return;
  }

  let businessId = null;
  let invoiceId = null;

  try {
    let authContext;
    try {
      authContext = await resolveHttpAuthUser(req);
    } catch (authError) {
      if (authError instanceof HttpAuthError) {
        return res.status(authError.status).json({ error: authError.message });
      }
      throw authError;
    }
    const authUid = authContext?.uid;

    businessId = req.query.businessId?.toString();
    invoiceId = req.query.invoiceId?.toString();
    if (!businessId || !invoiceId)
      return res
        .status(400)
        .json({ error: 'businessId e invoiceId son requeridos' });

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });
    await assertBusinessSubscriptionAccess({
      businessId,
      action: 'read',
      requiredModule: 'sales',
    });

    const invoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );
    const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);

    const [invSnap, canonSnap] = await Promise.all([
      invoiceRef.get(),
      canonRef.get(),
    ]);
    if (!invSnap.exists)
      return res.status(404).json({ error: 'Factura V2 no encontrada' });

    const inv = invSnap.data();
    let statusTimeline = Array.isArray(inv.statusTimeline)
      ? inv.statusTimeline
      : [];
    try {
      const timelineSnap = await invoiceRef
        .collection('timeline')
        .orderBy('at', 'asc')
        .limit(200)
        .get();
      if (!timelineSnap.empty) {
        statusTimeline = timelineSnap.docs.map(mapTimelineEventDoc);
      }
    } catch (timelineError) {
      logger.warn('No se pudo obtener timeline granular de factura', {
        businessId,
        invoiceId,
        error: timelineError?.message || timelineError,
      });
    }

    // Contar tareas por estado
    const outboxCol = invoiceRef.collection('outbox');
    const [pendingSnap, failedSnap, doneSnap] = await Promise.all([
      outboxCol.where('status', '==', 'pending').get(),
      outboxCol.where('status', '==', 'failed').get(),
      outboxCol.where('status', '==', 'done').get(),
    ]);

    const summary = {
      pending: pendingSnap.size,
      failed: failedSnap.size,
      done: doneSnap.size,
    };
    const mapTasks = (snap) =>
      snap.docs.map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          id: docSnap.id,
          type: data.type || null,
          status: data.status || null,
          attempts: data.attempts || 0,
          lastError: data.lastError || null,
          updatedAt: data.updatedAt || null,
          createdAt: data.createdAt || null,
        };
      });
    const failedTasks = mapTasks(failedSnap);
    const collectTaskTypes = (snap, target) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() || {};
        if (data?.type) {
          target.add(data.type);
        }
      });
    };
    const availableTasksSet = new Set();
    collectTaskTypes(pendingSnap, availableTasksSet);
    collectTaskTypes(failedSnap, availableTasksSet);
    collectTaskTypes(doneSnap, availableTasksSet);
    const availableTasks = Array.from(availableTasksSet);

    const canonical = canonSnap.exists ? canonSnap.data() : null;
    const canonicalData = canonical?.data || {};
    const snapshot = inv?.snapshot || {};
    const metaCashCount = snapshot?.meta?.cashCount || {};
    const invoiceDocRef = canonRef;
    const invoiceDocPath = invoiceDocRef.path;
    const cashCounts = [];
    const seenCashCountIds = new Set();
    const appendCashCountDoc = (docSnap) => {
      const mapped = mapCashCountDoc(docSnap);
      cashCounts.push(mapped);
      if (mapped?.id) {
        seenCashCountIds.add(mapped.id);
      }
    };

    const tryAppendCashCountById = async (
      candidate,
      { requireLegacyLink = true } = {},
    ) => {
      const normalized = normalizeCashCountCandidate(candidate);
      if (!normalized || seenCashCountIds.has(normalized)) return;
      try {
        const docSnap = await db
          .doc(`businesses/${businessId}/cashCounts/${normalized}`)
          .get();
        if (!docSnap.exists) return;
        const data = docSnap.data() || {};
        const cc = data.cashCount || {};
        const sales = cc.sales || data.sales || [];
        if (
          requireLegacyLink &&
          !hasInvoiceInSales(sales, invoiceDocPath, invoiceId)
        ) {
          return;
        }
        appendCashCountDoc(docSnap);
      } catch (fallbackError) {
        logger.warn('Fallback cash count lookup failed', {
          businessId,
          invoiceId,
          cashCountId: normalized,
          error: fallbackError?.message || fallbackError,
        });
      }
    };

    try {
      const cashCountSalesSnap = await db
        .collection(`businesses/${businessId}/cashCountSales`)
        .where('invoiceId', '==', invoiceId)
        .limit(10)
        .get();
      for (const saleDoc of cashCountSalesSnap.docs) {
        const sale = saleDoc.data() || {};
        await tryAppendCashCountById(sale.cashCountId || sale.cashCountRef, {
          requireLegacyLink: false,
        });
      }
    } catch (cashCountSalesError) {
      logger.warn('No se pudieron obtener vínculos cashCountSales', {
        businessId,
        invoiceId,
        error: cashCountSalesError?.message || cashCountSalesError,
      });
    }

    if (cashCounts.length === 0) {
      try {
        const cashCountsSnap = await db
          .collection(`businesses/${businessId}/cashCounts`)
          .where('cashCount.sales', 'array-contains', invoiceDocRef)
          .limit(5)
          .get();

        cashCountsSnap.docs.forEach(appendCashCountDoc);
      } catch (cashCountError) {
        logger.warn('No se pudieron obtener cuadres vinculados', {
          businessId,
          invoiceId,
          error: cashCountError?.message || cashCountError,
        });
      }
    }

    const fallbackCandidates = [
      metaCashCount?.resolvedCashCountId,
      metaCashCount?.resolvedCashCount,
      metaCashCount?.resolvedCashCountRef,
      metaCashCount?.intendedCashCountId,
      metaCashCount?.intendedCashCount,
      metaCashCount?.cashCountId,
      metaCashCount?.cashCount,
      snapshot?.cashCountIdHint,
      canonicalData?.cashCountId,
      canonicalData?.cashCountID,
      canonicalData?.cashCount?.id,
      canonicalData?.cashCount,
    ];
    for (const candidate of fallbackCandidates) {
      await tryAppendCashCountById(candidate);
    }

    if (cashCounts.length === 0) {
      try {
        const scanSnap = await db
          .collection(`businesses/${businessId}/cashCounts`)
          .limit(MAX_CASH_COUNT_SCAN)
          .get();
        scanSnap.docs.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const cc = data.cashCount || {};
          const sales = cc.sales || data.sales || [];
          if (!hasInvoiceInSales(sales, invoiceDocPath, invoiceId)) {
            return;
          }
          if (seenCashCountIds.has(docSnap.id)) {
            return;
          }
          appendCashCountDoc(docSnap);
        });
      } catch (scanError) {
        logger.warn('Cash count scan fallback failed', {
          businessId,
          invoiceId,
          error: scanError?.message || scanError,
        });
      }
    }

    return res.status(200).json({
      invoiceId,
      status: inv.status,
      createdAt: inv.createdAt || null,
      updatedAt: inv.updatedAt || null,
      statusTimeline,
      committedAt: inv.committedAt || null,
      snapshot: snapshot,
      summary,
      failedTasks,
      availableTasks,
      canonical,
      canonicalDate: canonicalData?.date || null,
      cashCounts,
    });
  } catch (err) {
    if (err instanceof https.HttpsError) {
      return res.status(mapHttpsErrorToHttpStatus(err.code)).json({
        error: err.message,
        code: err.code,
      });
    }
    const errorMessage = err?.message || String(err);
    logger.error('getInvoiceV2Http error', {
      message: errorMessage,
      stack: err?.stack,
      code: err?.code,
      businessId,
      invoiceId,
    });
    return res
      .status(500)
      .json({ error: 'Error interno al obtener la factura' });
  }
});
