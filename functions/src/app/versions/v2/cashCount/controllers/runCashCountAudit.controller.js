import { https, logger } from 'firebase-functions';

import { db } from '../../../../core/config/firebase.js';
import {
  assertUserAccess,
  getUserAccessProfile,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';
import { isAccountingRolloutEnabledForBusiness } from '../../accounting/utils/accountingRollout.util.js';

const ALL_BUSINESSES_SENTINEL = 'ALL';
const CARD_METHODS = new Set(['card', 'credit_card', 'debit_card']);
const TRANSFER_METHODS = new Set(['transfer', 'bank_transfer', 'check']);

const toBusinessId = (value) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getBanknoteTotal = (notes = []) =>
  Array.isArray(notes)
    ? notes.reduce(
      (t, { value = 0, quantity = 0 }) =>
        t + toNumber(value) * toNumber(quantity),
      0,
    )
    : 0;

const sumExpenses = (expenses = []) =>
  (Array.isArray(expenses) ? expenses : [])
    .filter((e) => e?.payment?.method === 'open_cash')
    .reduce((t, expense) => t + toNumber(expense?.amount), 0);

const normalizeMethod = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isCardMethod = (value) => CARD_METHODS.has(normalizeMethod(value));
const isTransferMethod = (value) => TRANSFER_METHODS.has(normalizeMethod(value));

const sumReceivableMetrics = (payments = []) =>
  (Array.isArray(payments) ? payments : []).reduce(
    (acc, p) => {
      acc.collected += toNumber(p.amount || p.totalPaid);
      const methods = Array.isArray(
        p.method || p.paymentMethod || p.paymentMethods,
      )
        ? p.method || p.paymentMethod || p.paymentMethods
        : [];
      methods.forEach((m) => {
        if (isCardMethod(m.method)) acc.card += toNumber(m.value);
        if (isTransferMethod(m.method)) acc.transfer += toNumber(m.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0 },
  );

const sumInvoiceMetrics = (invoices = []) =>
  (Array.isArray(invoices) ? invoices : []).reduce(
    (acc, invoice) => {
      const data = invoice?.data || invoice;
      const paymentMethod = Array.isArray(data?.paymentMethod)
        ? data.paymentMethod
        : [];
      const payment = data?.payment || {};

      const collectedAmount = toNumber(payment?.value);
      const invoicedAmount = toNumber(payment?.value);

      acc.collected += collectedAmount;
      acc.invoiced += invoicedAmount;

      paymentMethod.forEach((p) => {
        if (!p?.status) return;
        if (isCardMethod(p.method)) acc.card += toNumber(p.value);
        if (isTransferMethod(p.method)) acc.transfer += toNumber(p.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0, invoiced: 0 },
  );

const sumCashMovementMetrics = (movements = [], sourceType) =>
  (Array.isArray(movements) ? movements : []).reduce(
    (acc, movement) => {
      if (
        movement?.sourceType !== sourceType ||
        movement?.direction !== 'in' ||
        movement?.status === 'void'
      ) {
        return acc;
      }

      const amount = toNumber(movement?.amount);
      if (amount <= 0) {
        return acc;
      }

      acc.count += 1;
      acc.total += amount;
      if (isCardMethod(movement?.method)) acc.card += amount;
      if (isTransferMethod(movement?.method)) acc.transfer += amount;
      return acc;
    },
    { count: 0, total: 0, card: 0, transfer: 0 },
  );

const sumExpenseCashMovementTotal = (movements = []) =>
  (Array.isArray(movements) ? movements : []).reduce(
    (acc, movement) => {
      if (
        movement?.sourceType !== 'expense' ||
        movement?.direction !== 'out' ||
        movement?.status === 'void'
      ) {
        return acc;
      }

      const amount = toNumber(movement?.amount);
      if (amount <= 0) {
        return acc;
      }

      acc.count += 1;
      acc.total += amount;
      return acc;
    },
    { count: 0, total: 0 },
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
    snap = await cashCountsCol
      .orderBy('cashCount.createdAt', 'desc')
      .limit(100)
      .get();
  } catch (err) {
    logger.warn('Fallback cashCounts query without orderBy', {
      businessId,
      err: err?.message,
    });
    snap = await cashCountsCol.limit(100).get();
  }

  const inRange = (createdAtMs) => {
    if (startMs && (!createdAtMs || createdAtMs < startMs)) return false;
    if (endMs && (!createdAtMs || createdAtMs > endMs)) return false;
    return true;
  };

  const docs = snap.docs.filter((doc) => {
    const createdAtMs =
      toMillis(doc.get('cashCount.createdAt')) ||
      toMillis(doc.get('cashCount.closing.date'));
    return inRange(createdAtMs);
  });

  const results = [];

  for (const doc of docs) {
    try {
      const cashCount = doc.data().cashCount || {};
      const cashCountId = cashCount.id || doc.id;
      const useCashMovements = isAccountingRolloutEnabledForBusiness(businessId);

      let cashMovements = [];
      if (useCashMovements) {
        try {
          const movementsSnap = await db
            .collection(`businesses/${businessId}/cashMovements`)
            .where('cashCountId', '==', cashCountId)
            .get();
          cashMovements = movementsSnap.docs.map((movementDoc) => ({
            id: movementDoc.id,
            ...movementDoc.data(),
          }));
        } catch (err) {
          logger.warn('No se pudieron cargar cash movements', {
            businessId,
            cashCountId,
            error: err?.message || String(err),
          });
        }
      }

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
      const salesMovementMetrics = sumCashMovementMetrics(
        cashMovements,
        'invoice_pos',
      );
      const receivableMovementMetrics = sumCashMovementMetrics(
        cashMovements,
        'receivable_payment',
      );
      const expenseMovementMetrics = sumExpenseCashMovementTotal(cashMovements);

      const legacyInvoiceMetrics = sumInvoiceMetrics(invoices);
      const legacyReceivableMetrics = sumReceivableMetrics(arPayments);
      const legacyTotalExpenses = sumExpenses(expenses);

      const invoiceMetrics =
        salesMovementMetrics.count > 0
          ? {
            card: salesMovementMetrics.card,
            transfer: salesMovementMetrics.transfer,
            collected: salesMovementMetrics.total,
            invoiced: salesMovementMetrics.total,
          }
          : legacyInvoiceMetrics;
      const arMetrics =
        receivableMovementMetrics.count > 0
          ? {
            card: receivableMovementMetrics.card,
            transfer: receivableMovementMetrics.transfer,
            collected: receivableMovementMetrics.total,
          }
          : legacyReceivableMetrics;
      const totalExpenses =
        expenseMovementMetrics.count > 0
          ? expenseMovementMetrics.total
          : legacyTotalExpenses;
      const totalCard = invoiceMetrics.card + arMetrics.card;
      const totalTransfer = invoiceMetrics.transfer + arMetrics.transfer;
      const register = closeBank + totalCard + totalTransfer;
      const system =
        invoiceMetrics.collected +
        arMetrics.collected +
        openBank -
        totalExpenses;
      const discrepancy = register - system;
      const recalculated = {
        totalCard,
        totalTransfer,
        totalCharged: invoiceMetrics.collected,
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

      const delta =
        toNumber(stored.totalDiscrepancy) -
        toNumber(recalculated.totalDiscrepancy);

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
  const {
    businessId,
    from = null,
    to = null,
    threshold = 0,
    allBusinesses = false,
  } = data || {};

  const authUid = context?.auth?.uid || null;
  if (!authUid) {
    throw new https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const requestedBusinessId = toBusinessId(businessId);
  const requestedAllBusinesses =
    Boolean(allBusinesses) ||
    requestedBusinessId?.toUpperCase() === ALL_BUSINESSES_SENTINEL;

  if (!requestedBusinessId && !requestedAllBusinesses) {
    throw new https.HttpsError('invalid-argument', 'businessId es requerido');
  }

  const effectiveBusinessId = requestedBusinessId || ALL_BUSINESSES_SENTINEL;

  const startMs = Number(from) || null;
  const endMs = Number(to) || null;
  const absThreshold = Math.max(0, Number(threshold) || 0);

  const isAll = requestedAllBusinesses;

  if (!isAll) {
    await assertUserAccess({
      authUid,
      businessId: effectiveBusinessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
    });

    await assertBusinessSubscriptionAccess({
      businessId: effectiveBusinessId,
      action: 'read',
      requiredModule: 'cashReconciliation',
    });
  } else {
    const profile = await getUserAccessProfile(authUid);
    if (!profile.userSnap?.exists) {
      throw new https.HttpsError('permission-denied', 'Usuario no encontrado');
    }

    if (!profile.hasGlobalUnscopedAccess) {
      throw new https.HttpsError(
        'permission-denied',
        'Solo usuarios dev pueden auditar todos los negocios',
      );
    }
  }

  if (!isAll) {
    const { discrepancies, scanned } = await auditBusiness({
      businessId: effectiveBusinessId,
      startMs,
      endMs,
      absThreshold,
    });

    const response = {
      status: 'done',
      businessId: effectiveBusinessId,
      businessIds: [effectiveBusinessId],
      range: { from: startMs, to: endMs },
      threshold: absThreshold,
      scanned,
      discrepancies,
      runId: `run-${Date.now()}`,
      createdAt: Date.now(),
    };

    logger.info('runCashCountAudit completed', {
      businessId: effectiveBusinessId,
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
