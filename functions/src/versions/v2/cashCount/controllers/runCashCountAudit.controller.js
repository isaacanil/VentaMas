import { https, logger } from 'firebase-functions';

import { db } from '../../../../core/config/firebase.js';

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getBanknoteTotal = (notes = []) =>
  Array.isArray(notes)
    ? notes.reduce(
        (t, { value = 0, quantity = 0 }) => t + toNumber(value) * toNumber(quantity),
        0,
      )
    : 0;

const sumExpenses = (expenses = []) =>
  (Array.isArray(expenses) ? expenses : [])
    .filter((e) => e?.payment?.method === 'open_cash')
    .reduce((t, expense) => t + toNumber(expense?.amount), 0);

const sumReceivableMetrics = (payments = []) =>
  (Array.isArray(payments) ? payments : []).reduce(
    (acc, p) => {
      acc.collected += toNumber(p.amount || p.totalPaid);
      const methods = Array.isArray(p.method || p.paymentMethod || p.paymentMethods)
        ? p.method || p.paymentMethod || p.paymentMethods
        : [];
      methods.forEach((m) => {
        if (m.method === 'card') acc.card += toNumber(m.value);
        if (m.method === 'transfer') acc.transfer += toNumber(m.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0 },
  );

const sumInvoiceMetrics = (invoices = []) =>
  (Array.isArray(invoices) ? invoices : []).reduce(
    (acc, invoice) => {
      const data = invoice?.data || invoice;
      const paymentMethod = Array.isArray(data?.paymentMethod) ? data.paymentMethod : [];
      const payment = data?.payment || {};

      const collectedAmount = toNumber(payment?.value);
      const invoicedAmount = toNumber(payment?.value);

      acc.collected += collectedAmount;
      acc.invoiced += invoicedAmount;

      paymentMethod.forEach((p) => {
        if (!p?.status) return;
        if (p.method === 'card') acc.card += toNumber(p.value);
        if (p.method === 'transfer') acc.transfer += toNumber(p.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0, invoiced: 0 },
  );

const toMillis = (ts) => {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  if (ts._seconds) return ts._seconds * 1000;
  return null;
};

async function auditBusiness({ businessId, startMs, endMs, absThreshold }) {
  const cashCountsCol = db.collection(`businesses/${businessId}/cashCounts`);

  let snap;
  try {
    snap = await cashCountsCol.orderBy('cashCount.createdAt', 'desc').limit(100).get();
  } catch (err) {
    logger.warn('Fallback cashCounts query without orderBy', { businessId, err: err?.message });
    snap = await cashCountsCol.limit(100).get();
  }

  const inRange = (createdAtMs) => {
    if (startMs && (!createdAtMs || createdAtMs < startMs)) return false;
    if (endMs && (!createdAtMs || createdAtMs > endMs)) return false;
    return true;
  };

  const docs = snap.docs.filter((doc) => {
    const createdAtMs = toMillis(doc.get('cashCount.createdAt')) || toMillis(doc.get('cashCount.closing.date'));
    return inRange(createdAtMs);
  });

  const results = [];

  for (const doc of docs) {
    try {
      const cashCount = doc.data().cashCount || {};
      const cashCountId = cashCount.id || doc.id;

      const invoicesSnap = await db
        .collection(`businesses/${businessId}/invoices`)
        .where('data.cashCountId', '==', cashCountId)
        .get();
      const invoices = invoicesSnap.docs.map((d) => d.data());

      const expensesSnap = await db
        .collection(`businesses/${businessId}/expenses`)
        .where('expense.payment.cashRegister', '==', cashCountId)
        .get();
      const expenses = expensesSnap.docs.map((d) => d.data()?.expense);

      const openingTs = cashCount?.opening?.date;
      const closingTs = cashCount?.closing?.date;
      const start = toMillis(openingTs);
      const end = toMillis(closingTs) || Date.now();

      const cashierId =
        cashCount?.opening?.employee?.id ||
        cashCount?.opening?.employee?.uid ||
        cashCount?.opening?.employee?._path?.segments?.slice(-1)?.pop() ||
        cashCount?.opening?.employee?._key?.path?.segments?.slice(-1)?.pop() ||
        null;

      let arPayments = [];
      if (cashierId && start) {
        try {
          const paymentsQuery = db
            .collection(`businesses/${businessId}/accountsReceivablePayments`)
            .where('createdUserId', '==', cashierId);
          const paymentsSnap = await paymentsQuery.get();
          arPayments = paymentsSnap.docs
            .map((d) => d.data())
            .filter((p) => {
              const created = toMillis(p?.createdAt);
              if (created == null) return true;
              return created >= start && created <= end;
            });
        } catch (err) {
          logger.warn('No se pudieron cargar pagos CxC', {
            businessId,
            cashCountId,
            error: err?.message || String(err),
          });
        }
      }

      const openBank = getBanknoteTotal(cashCount?.opening?.banknotes);
      const closeBank = getBanknoteTotal(cashCount?.closing?.banknotes);
      const totalExpenses = sumExpenses(expenses);
      const invoiceMetrics = sumInvoiceMetrics(invoices);
      const arMetrics = sumReceivableMetrics(arPayments);
      const totalCard = invoiceMetrics.card + arMetrics.card;
      const totalTransfer = invoiceMetrics.transfer + arMetrics.transfer;
      const register = closeBank + totalCard + totalTransfer;
      const system = invoiceMetrics.collected + arMetrics.collected + openBank - totalExpenses;
      const discrepancy = register - system;
      const recalculated = {
        totalCard,
        totalTransfer,
        totalCharged: invoiceMetrics.invoiced,
        totalReceivables: arMetrics.collected,
        totalSystem: system,
        totalRegister: register,
        totalDiscrepancy: discrepancy,
        totalExpenses,
      };

      const stored = {
        totalCard: toNumber(cashCount?.totalCard),
        totalTransfer: toNumber(cashCount?.totalTransfer),
        totalCharged: toNumber(cashCount?.totalCharged),
        totalReceivables: toNumber(cashCount?.totalReceivables),
        totalSystem: toNumber(cashCount?.totalSystem),
        totalRegister: toNumber(cashCount?.totalRegister),
        totalDiscrepancy: toNumber(cashCount?.totalDiscrepancy),
      };

      const delta = toNumber(stored.totalDiscrepancy) - toNumber(recalculated.totalDiscrepancy);

      if (Math.abs(delta) > absThreshold) {
        results.push({
          businessId,
          cashCountId,
          state: cashCount?.state || null,
          delta,
          discrepancyStored: stored.totalDiscrepancy,
          discrepancyRecalc: recalculated.totalDiscrepancy,
          stored,
          recalculated,
        });
      }
    } catch (err) {
      logger.error('Error audit cashCount', {
        businessId,
        cashCountId: doc.id,
        error: err?.message || String(err),
      });
    }
  }

  return {
    businessId,
    scanned: docs.length,
    discrepancies: results,
  };
}

export const runCashCountAudit = https.onCall(async (data, context) => {
  const { businessId, from = null, to = null, threshold = 0, allBusinesses = false } = data || {};
  if (!businessId || typeof businessId !== 'string') {
    throw new https.HttpsError('invalid-argument', 'businessId es requerido');
  }

  const startMs = Number(from) || null;
  const endMs = Number(to) || null;
  const absThreshold = Math.max(0, Number(threshold) || 0);

  const isAll = allBusinesses || businessId === 'ALL';

  if (!isAll) {
    const { discrepancies, scanned } = await auditBusiness({ businessId, startMs, endMs, absThreshold });

    const response = {
      status: 'done',
      businessId,
      businessIds: [businessId],
      range: { from: startMs, to: endMs },
      threshold: absThreshold,
      scanned,
      discrepancies,
      runId: `run-${Date.now()}`,
      createdAt: Date.now(),
    };

    logger.info('runCashCountAudit completed', {
      businessId,
      scanned,
      discrepancies: discrepancies.length,
    });

    return response;
  }

  const bizSnap = await db.collection('businesses').limit(100).get();
  const bizIds = bizSnap.docs.map((d) => d.id);

  let totalScanned = 0;
  const allDiscrepancies = [];

  for (const bizId of bizIds) {
    try {
      const { discrepancies, scanned } = await auditBusiness({
        businessId: bizId,
        startMs,
        endMs,
        absThreshold,
      });
      totalScanned += scanned;
      allDiscrepancies.push(...discrepancies);
    } catch (err) {
      logger.error('Error auditing business in ALL mode', {
        businessId: bizId,
        error: err?.message || String(err),
      });
    }
  }

  const response = {
    status: 'done',
    businessId: 'ALL',
    businessIds: bizIds,
    range: { from: startMs, to: endMs },
    threshold: absThreshold,
    scanned: totalScanned,
    discrepancies: allDiscrepancies,
    runId: `run-${Date.now()}`,
    createdAt: Date.now(),
  };

  logger.info('runCashCountAudit completed', {
    businessId: 'ALL',
    scanned: totalScanned,
    discrepancies: allDiscrepancies.length,
  });

  return response;
});
