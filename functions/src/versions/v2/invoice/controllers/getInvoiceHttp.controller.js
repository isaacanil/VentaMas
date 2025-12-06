import { https, logger } from 'firebase-functions';

import { db } from '../../../../core/config/firebase.js';
import {
  resolveHttpAuthUser,
  HttpAuthError,
} from '../../auth/services/httpAuth.service.js';

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-Token',
  );
}

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

export const getInvoiceV2Http = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' });

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

    const businessId = req.query.businessId?.toString();
    const invoiceId = req.query.invoiceId?.toString();
    if (!businessId || !invoiceId)
      return res
        .status(400)
        .json({ error: 'businessId e invoiceId son requeridos' });

    // Verificar que el usuario pertenece al negocio (si está en el doc de usuario)
    const userSnap = await db.doc(`users/${authUid}`).get();
    const userBiz = userSnap.exists ? userSnap.get('businessID') : null;
    if (userBiz && userBiz !== businessId) {
      return res.status(403).json({ error: 'No autorizado para este negocio' });
    }

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
    let cashCounts = [];
    const seenCashCountIds = new Set();
    try {
      const cashCountsSnap = await db
        .collection(`businesses/${businessId}/cashCounts`)
        .where('cashCount.sales', 'array_contains', invoiceDocRef)
        .limit(5)
        .get();

      cashCounts = cashCountsSnap.docs.map(mapCashCountDoc);
      cashCounts.forEach((item) => {
        if (item?.id) seenCashCountIds.add(item.id);
      });
    } catch (cashCountError) {
      logger.warn('No se pudieron obtener cuadres vinculados', {
        businessId,
        invoiceId,
        error: cashCountError?.message || cashCountError,
      });
    }

    const appendCashCountDoc = (docSnap) => {
      const mapped = mapCashCountDoc(docSnap);
      cashCounts.push(mapped);
      if (mapped?.id) {
        seenCashCountIds.add(mapped.id);
      }
    };

    const tryAppendCashCountById = async (candidate) => {
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
        if (!hasInvoiceInSales(sales, invoiceDocPath, invoiceId)) {
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
      // eslint-disable-next-line no-await-in-loop
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
      statusTimeline: inv.statusTimeline || [],
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
    const errorMessage = err?.message || String(err);
    logger.error('getInvoiceV2Http error', {
      message: errorMessage,
      stack: err?.stack,
      code: err?.code,
      businessId,
      invoiceId,
    });
    return res.status(500).json({ error: 'Error interno', message: errorMessage });
  }
});
