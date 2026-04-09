import { https, logger } from 'firebase-functions';

import { FieldPath, db } from '../../../../core/config/firebase.js';
import {
  resolveHttpAuthUser,
  HttpAuthError,
} from '../../auth/services/httpAuth.service.js';
import {
  assertUserAccess,
  getUserAccessProfile,
  getUserBusinessScope,
  MEMBERSHIP_ROLE_GROUPS,
  scheduleRepairTasks,
} from '../services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';

const MAX_BUSINESS_LIMIT = 50;
const MAX_INVOICE_LIMIT = 50;
const DEFAULT_BUSINESS_LIMIT = 10;
const DEFAULT_INVOICE_LIMIT = 10;
const AUTO_REASON = 'Recuperación automática masiva';

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-Token',
  );
}

const clampNumber = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < min) return min;
  if (numeric > max) return max;
  return Math.floor(numeric);
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const extractNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

function getReceivableMetadata(invoice) {
  const snapshot = invoice?.snapshot || {};
  const cart = snapshot?.cart || {};
  const candidates = [
    snapshot?.accountsReceivable,
    cart?.accountsReceivable,
    invoice?.accountsReceivable,
    invoice?.snapshot?.accountsReceivable,
  ].filter(Boolean);
  let totalInstallments = 0;
  candidates.forEach((candidate) => {
    const numeric = extractNumber(candidate?.totalInstallments);
    if (numeric && numeric > totalInstallments) {
      totalInstallments = numeric;
    }
  });
  const isAdded =
    Boolean(cart?.isAddedToReceivables) ||
    Boolean(snapshot?.isAddedToReceivables) ||
    Boolean(invoice?.isAddedToReceivables) ||
    candidates.some((candidate) => Boolean(candidate?.isAddedToReceivables));
  return {
    totalInstallments,
    isAdded,
  };
}

function expectsAccountsReceivable(invoice) {
  const meta = getReceivableMetadata(invoice);
  return Boolean(meta.isAdded && meta.totalInstallments > 0);
}

async function hasAccountsReceivable({ businessId, invoiceId }) {
  const arSnap = await db
    .collection(`businesses/${businessId}/accountsReceivable`)
    .where('invoiceId', '==', invoiceId)
    .limit(1)
    .get();
  return !arSnap.empty;
}

async function evaluateInvoiceNeeds({ businessId, invoiceId, invoice }) {
  try {
    const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
    const canonSnap = await canonRef.get();
    const needsCanonical = !canonSnap.exists;
    const expectsReceivable = expectsAccountsReceivable(invoice);
    let needsReceivable = false;
    if (expectsReceivable) {
      const receivableExists = await hasAccountsReceivable({
        businessId,
        invoiceId,
      });
      needsReceivable = !receivableExists;
    }
    const tasks = [];
    if (needsCanonical) {
      tasks.push('createCanonicalInvoice');
    }
    if (needsReceivable) {
      tasks.push('setupAR');
    }
    return { needsCanonical, needsReceivable, tasks };
  } catch (err) {
    return {
      error: err?.message || 'No se pudo evaluar la factura',
    };
  }
}

async function fetchBusinessBatch({ limit, startAfter }) {
  let query = db
    .collection('businesses')
    .orderBy(FieldPath.documentId())
    .limit(limit);
  if (startAfter) {
    query = query.startAfter(startAfter);
  }
  const snap = await query.get();
  const ids = snap.docs.map((doc) => doc.id);
  const nextCursor =
    snap.size === limit ? snap.docs[snap.docs.length - 1].id : null;
  return { ids, nextCursor };
}

function buildInvoiceQuery({ businessId, limit, startAfterId }) {
  let query = db
    .collection(`businesses/${businessId}/invoicesV2`)
    .orderBy(FieldPath.documentId())
    .limit(limit);
  if (startAfterId) {
    query = query.startAfter(startAfterId);
  }
  return query;
}

export const autoRepairInvoiceV2Http = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    const runForAllBusinesses = parseBoolean(
      req.body?.runForAllBusinesses,
      false,
    );
    const targetBusinessId = req.body?.businessId?.toString?.() || null;
    const startAfterBusinessId =
      req.body?.startAfterBusinessId?.toString?.() || null;
    const startAfterInvoiceId =
      req.body?.startAfterInvoiceId?.toString?.() || null;
    const invoicesLimit = clampNumber(
      req.body?.invoicesLimit,
      1,
      MAX_INVOICE_LIMIT,
      DEFAULT_INVOICE_LIMIT,
    );
    const businessLimit = clampNumber(
      req.body?.businessLimit,
      1,
      MAX_BUSINESS_LIMIT,
      DEFAULT_BUSINESS_LIMIT,
    );
    const dryRun = parseBoolean(req.body?.dryRun, false);

    if (!runForAllBusinesses && !targetBusinessId) {
      return res.status(400).json({
        error: 'Debes indicar businessId o habilitar runForAllBusinesses',
      });
    }

    const userBusinessScope = await getUserBusinessScope(authUid);
    const userAccessProfile = await getUserAccessProfile(authUid);
    if (runForAllBusinesses && !userAccessProfile.hasGlobalUnscopedAccess) {
      return res.status(403).json({
        error:
          'No autorizado para ejecutar runForAllBusinesses.',
      });
    }

    let businessIds = [];
    let nextBusinessCursor = null;
    if (runForAllBusinesses) {
      const batch = await fetchBusinessBatch({
        limit: businessLimit,
        startAfter: startAfterBusinessId,
      });
      businessIds = batch.ids;
      nextBusinessCursor = batch.nextCursor;
    } else if (targetBusinessId) {
      businessIds = [targetBusinessId];
    }

    if (!businessIds.length) {
      return res.status(200).json({
        dryRun,
        metrics: {
          businessesProcessed: 0,
          invoicesScanned: 0,
          invoicesWithIssues: 0,
          tasksScheduled: 0,
        },
        businesses: [],
        nextPage: null,
      });
    }

    const businesses = [];
    let invoicesScanned = 0;
    let invoicesWithIssues = 0;
    let tasksScheduled = 0;

    for (const businessId of businessIds) {
      await assertUserAccess({
        authUid,
        businessId,
        userBusinessId: userBusinessScope,
        allowedRoles: MEMBERSHIP_ROLE_GROUPS.MAINTENANCE,
      });
      await assertBusinessSubscriptionAccess({
        businessId,
        action: dryRun ? 'read' : 'write',
        requiredModule: 'sales',
      });
      const summary = {
        businessId,
        invoicesScanned: 0,
        repairs: [],
      };

      const invoiceQuery = buildInvoiceQuery({
        businessId,
        limit: invoicesLimit,
        startAfterId: !runForAllBusinesses ? startAfterInvoiceId : null,
      });

      const invoicesSnap = await invoiceQuery.get();
      summary.invoicesScanned = invoicesSnap.size;
      invoicesScanned += invoicesSnap.size;

      if (invoicesSnap.size === invoicesLimit) {
        const lastDoc = invoicesSnap.docs[invoicesSnap.docs.length - 1];
        summary.nextInvoiceCursor = lastDoc.id;
      }

      for (const docSnap of invoicesSnap.docs) {
        const invoiceId = docSnap.id;
        const invoice = docSnap.data() || {};
        const evaluation = await evaluateInvoiceNeeds({
          businessId,
          invoiceId,
          invoice,
        });
        if (evaluation?.error) {
          summary.repairs.push({
            invoiceId,
            status: 'error',
            reason: evaluation.error,
          });
          continue;
        }
        if (!evaluation.tasks.length) {
          continue;
        }
        invoicesWithIssues += 1;
        const entry = {
          invoiceId,
          needsCanonical: evaluation.needsCanonical,
          needsReceivable: evaluation.needsReceivable,
          tasks: evaluation.tasks,
        };
        if (dryRun) {
          entry.status = 'dry_run';
        } else {
          const taskResults = await scheduleRepairTasks({
            businessId,
            invoiceId,
            taskTypes: evaluation.tasks,
            authUid,
            reason: AUTO_REASON,
            invoice,
          });
          entry.status = 'scheduled';
          entry.taskResults = taskResults;
          const scheduledCount = taskResults.filter(
            (task) => task.status === 'scheduled',
          ).length;
          tasksScheduled += scheduledCount;
        }
        summary.repairs.push(entry);
      }

      businesses.push(summary);
    }

    return res.status(200).json({
      dryRun,
      metrics: {
        businessesProcessed: businesses.length,
        invoicesScanned,
        invoicesWithIssues,
        tasksScheduled,
      },
      businesses,
      nextPage:
        runForAllBusinesses && nextBusinessCursor
          ? { startAfterBusinessId: nextBusinessCursor }
          : null,
    });
  } catch (err) {
    logger.error('autoRepairInvoiceV2Http error', {
      message: err?.message,
      stack: err?.stack,
    });
    if (err instanceof https.HttpsError) {
      return res.status(mapHttpsErrorToStatus(err.code)).json({
        error: err.message,
        code: err.code,
      });
    }
    return res.status(500).json({
      error: err?.message || 'Error interno',
    });
  }
});

function mapHttpsErrorToStatus(code) {
  switch (code) {
  case 'permission-denied':
    return 403;
  case 'unauthenticated':
    return 401;
  case 'not-found':
    return 404;
  case 'failed-precondition':
    return 412;
  case 'resource-exhausted':
    return 429;
  case 'already-exists':
    return 409;
  case 'invalid-argument':
  default:
    return 400;
  }
}
