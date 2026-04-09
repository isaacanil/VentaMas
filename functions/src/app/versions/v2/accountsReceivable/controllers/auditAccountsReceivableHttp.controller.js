import { https, logger } from 'firebase-functions';

import { db, Timestamp } from '../../../../core/config/firebase.js';
import {
  resolveHttpAuthUser,
  HttpAuthError,
} from '../../auth/services/httpAuth.service.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';

const DEFAULT_DAYS = 30;
const MAX_DAYS = 120;
const DEFAULT_SAMPLE_LIMIT = 20;
const MAX_SAMPLE_LIMIT = 50;
const SCAN_MULTIPLIER = 4;
const EPSILON = 0.05;

const mapHttpsErrorToHttpStatus = (code) => {
  switch (code) {
  case 'permission-denied':
    return 403;
  case 'unauthenticated':
    return 401;
  case 'not-found':
    return 404;
  case 'failed-precondition':
    return 412;
  case 'already-exists':
  case 'invalid-argument':
  case 'aborted':
    return 400;
  case 'resource-exhausted':
    return 429;
  case 'deadline-exceeded':
    return 504;
  default:
    return 400;
  }
};

const setCors = (res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-Token',
  );
};

const clampNumber = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < min) return min;
  if (numeric > max) return max;
  return Math.floor(numeric);
};

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const safeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const timer = () => {
  const started = Date.now();
  return {
    end: () => Date.now() - started,
  };
};

const unwrapInvoiceDoc = (invoice) => {
  if (!invoice || typeof invoice !== 'object') return {};
  const candidate =
    invoice.data && typeof invoice.data === 'object' ? invoice.data : invoice;
  return candidate || {};
};

const getReceivableMetadata = (invoice) => {
  const payload = unwrapInvoiceDoc(invoice);
  const snapshot = payload?.snapshot || {};
  const cart = snapshot?.cart || payload?.cart || {};
  const candidates = [
    snapshot?.accountsReceivable,
    cart?.accountsReceivable,
    payload?.accountsReceivable,
    payload?.snapshot?.accountsReceivable,
  ].filter(Boolean);

  let totalInstallments = 0;
  candidates.forEach((candidate) => {
    const count = Number(candidate?.totalInstallments);
    if (Number.isFinite(count) && count > totalInstallments) {
      totalInstallments = count;
    }
  });

  const isAdded =
    Boolean(cart?.isAddedToReceivables) ||
    Boolean(snapshot?.isAddedToReceivables) ||
    Boolean(payload?.isAddedToReceivables) ||
    candidates.some((candidate) => Boolean(candidate?.isAddedToReceivables));

  return {
    isAdded,
    totalInstallments,
  };
};

const expectsAccountsReceivable = (invoice) => {
  const meta = getReceivableMetadata(invoice);
  return Boolean(meta.isAdded && meta.totalInstallments > 0);
};

async function hasAccountsReceivable({ businessId, invoiceId }) {
  const snap = await db
    .collection(`businesses/${businessId}/accountsReceivable`)
    .where('invoiceId', '==', invoiceId)
    .limit(1)
    .get();
  return !snap.empty;
}

async function getSetupARTaskMetadata({ businessId, invoiceId }) {
  const outboxPathCandidates = [
    `businesses/${businessId}/invoicesV2/${invoiceId}/outbox`,
    `businesses/${businessId}/invoices/${invoiceId}/outbox`,
  ];

  try {
    let tasksSnap = null;
    for (const path of outboxPathCandidates) {
      const snap = await db
        .collection(path)
        .where('type', '==', 'setupAR')
        .get();
      if (!snap.empty) {
        tasksSnap = snap;
        break;
      }
    }

    if (!tasksSnap || tasksSnap.empty) {
      return null;
    }

    const tasks = tasksSnap.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          id: docSnap.id,
          status: data.status || null,
          attempts: safeNumber(data.attempts),
          lastError: data.lastError || null,
          updatedAt:
            toMillis(docSnap.get('updatedAt')) ||
            toMillis(data.updatedAt) ||
            null,
          createdAt:
            toMillis(docSnap.get('createdAt')) ||
            toMillis(data.createdAt) ||
            null,
          skipped: Boolean(data.skipped),
          resultArId: data?.result?.arId || null,
        };
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const latest = tasks[0];
    return {
      taskId: latest?.id || null,
      status: latest?.status || null,
      attempts: latest?.attempts ?? 0,
      lastError: latest?.lastError || null,
      updatedAt: latest?.updatedAt || null,
      createdAt: latest?.createdAt || null,
      skipped: Boolean(latest?.skipped),
      resultArId: latest?.resultArId || null,
      totalTasks: tasks.length,
      hasPending: tasks.some((task) => task.status === 'pending'),
      hasFailed: tasks.some((task) => task.status === 'failed'),
    };
  } catch (error) {
    logger.error('[auditAccountsReceivableHttp] Failed to load setupAR tasks', {
      businessId,
      invoiceId,
      error: error?.message,
    });
    return {
      error: error?.message || 'No se pudo leer tasks de outbox',
    };
  }
}

const normalizeInvoiceBasicInfo = (invoiceId, invoice, createdAt) => {
  const payload = unwrapInvoiceDoc(invoice);
  const snapshot = payload?.snapshot || {};
  const cart = snapshot?.cart || payload?.cart || {};
  const client = snapshot?.client || payload?.client || cart?.client || {};
  const totals = snapshot?.totals || cart?.payment || {};
  const amount =
    totals?.totalAmount ??
    totals?.value ??
    totals?.amount ??
    totals?.total ??
    null;

  return {
    invoiceId,
    number:
      payload?.numberID ||
      snapshot?.numberID ||
      cart?.numberID ||
      snapshot?.number ||
      null,
    clientId: client?.id || null,
    clientName: client?.name || null,
    createdAt: toMillis(createdAt) || toMillis(payload?.createdAt) || null,
    totalAmount: safeNumber(amount),
    meta: {
      isAddedToReceivables: Boolean(
        cart?.isAddedToReceivables ||
        snapshot?.isAddedToReceivables ||
        payload?.isAddedToReceivables,
      ),
      totalInstallments: getReceivableMetadata(payload).totalInstallments,
    },
  };
};

async function collectReceivableOutboxTasks({
  businessId,
  sinceTs,
  sampleLimit,
}) {
  const scanLimit = Math.max(sampleLimit * SCAN_MULTIPLIER, sampleLimit);
  let query = db
    .collectionGroup('outbox')
    .where('type', '==', 'setupAR')
    .where('payload.businessId', '==', businessId);

  if (sinceTs) {
    query = query.where('updatedAt', '>=', sinceTs);
  }

  query = query.orderBy('updatedAt', 'desc');

  const tasksSnap = await query.limit(scanLimit).get();
  const issues = [];

  for (const docSnap of tasksSnap.docs) {
    if (issues.length >= sampleLimit) break;
    const data = docSnap.data() || {};
    const outboxRef = docSnap.ref;
    const invoiceRef = outboxRef.parent?.parent || null;
    const invoiceId = invoiceRef?.id || null;
    const updatedAt =
      toMillis(docSnap.get('updatedAt')) || toMillis(data.updatedAt) || null;
    const createdAt =
      toMillis(docSnap.get('createdAt')) || toMillis(data.createdAt) || null;

    let invoiceInfo = null;
    let hasReceivable = false;
    if (invoiceRef) {
      const invoiceSnap = await invoiceRef.get();
      if (invoiceSnap.exists) {
        invoiceInfo = normalizeInvoiceBasicInfo(
          invoiceId,
          invoiceSnap.data() || {},
          invoiceSnap.get('createdAt'),
        );
      }
      if (invoiceId) {
        hasReceivable = await hasAccountsReceivable({
          businessId,
          invoiceId,
        });
      }
    }

    issues.push({
      taskId: docSnap.id,
      invoiceId,
      invoiceNumber: invoiceInfo?.number || null,
      clientName: invoiceInfo?.clientName || null,
      createdAt,
      updatedAt,
      status: data.status || null,
      attempts: safeNumber(data.attempts),
      lastError: data.lastError || null,
      skipped: Boolean(data.skipped),
      resultArId: data?.result?.arId || null,
      hasReceivable,
    });
  }

  return {
    scanned: tasksSnap.size,
    sampleLimit,
    issues,
  };
}

async function collectInvoicesMissingReceivable({
  businessId,
  sinceTs,
  sampleLimit,
}) {
  const scanLimit = Math.max(sampleLimit * SCAN_MULTIPLIER, sampleLimit);
  const invoicesRef = db.collection(`businesses/${businessId}/invoices`);
  let query = invoicesRef.orderBy('createdAt', 'desc');
  if (sinceTs) {
    query = invoicesRef
      .where('createdAt', '>=', sinceTs)
      .orderBy('createdAt', 'desc');
  }
  const querySnap = await query.limit(scanLimit).get();

  const issues = [];
  for (const docSnap of querySnap.docs) {
    if (issues.length >= sampleLimit) break;
    const invoice = docSnap.data() || {};
    if (!expectsAccountsReceivable(invoice)) continue;
    const hasAr = await hasAccountsReceivable({
      businessId,
      invoiceId: docSnap.id,
    });
    if (hasAr) continue;
    const outboxTask = await getSetupARTaskMetadata({
      businessId,
      invoiceId: docSnap.id,
    });
    issues.push({
      ...normalizeInvoiceBasicInfo(
        docSnap.id,
        invoice,
        docSnap.get('createdAt'),
      ),
      outboxTask,
    });
  }

  return {
    scanned: querySnap.size,
    sampleLimit,
    issues,
  };
}

async function collectInstallmentSummary({ businessId, arId }) {
  const installmentsSnap = await db
    .collection(`businesses/${businessId}/accountsReceivableInstallments`)
    .where('arId', '==', arId)
    .get();

  let totalBalance = 0;
  installmentsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    totalBalance += safeNumber(data.installmentBalance);
  });

  return {
    count: installmentsSnap.size,
    totalBalance,
  };
}

async function collectReceivableInconsistencies({
  businessId,
  sinceTs,
  sampleLimit,
}) {
  const scanLimit = Math.max(sampleLimit * SCAN_MULTIPLIER, sampleLimit);
  const arRef = db.collection(`businesses/${businessId}/accountsReceivable`);
  let arQuery = arRef.orderBy('updatedAt', 'desc');
  if (sinceTs) {
    arQuery = arRef
      .where('updatedAt', '>=', sinceTs)
      .orderBy('updatedAt', 'desc');
  }
  const arSnap = await arQuery.limit(scanLimit).get();

  const issues = [];
  for (const docSnap of arSnap.docs) {
    if (issues.length >= sampleLimit) break;
    const data = docSnap.data() || {};
    const installmentSummary = await collectInstallmentSummary({
      businessId,
      arId: docSnap.id,
    });

    const arBalance = safeNumber(data.arBalance);
    const diffInstallments = Math.abs(
      arBalance - installmentSummary.totalBalance,
    );

    let invoiceDiff = null;
    let invoiceNumber = null;
    if (data.invoiceId) {
      const invoiceSnap = await db
        .doc(`businesses/${businessId}/invoices/${data.invoiceId}`)
        .get();
      if (invoiceSnap.exists) {
        const invoiceData = invoiceSnap.data()?.data || invoiceSnap.data();
        const balanceDue = safeNumber(invoiceData?.balanceDue);
        invoiceDiff = Math.abs(arBalance - balanceDue);
        invoiceNumber =
          invoiceData?.numberID ??
          invoiceData?.number ??
          invoiceData?.invoiceNumber ??
          null;
      }
    }

    if (diffInstallments <= EPSILON && (!invoiceDiff || invoiceDiff <= EPSILON))
      continue;

    issues.push({
      arId: docSnap.id,
      invoiceId: data.invoiceId || null,
      invoiceNumber,
      clientId: data.clientId || null,
      arBalance,
      installmentsBalance: installmentSummary.totalBalance,
      installmentsCount: installmentSummary.count,
      invoiceBalanceDue: invoiceDiff != null ? arBalance - invoiceDiff : null,
      diffAgainstInstallments: diffInstallments,
      diffAgainstInvoice: invoiceDiff,
    });
  }

  return {
    scanned: arSnap.size,
    sampleLimit,
    issues,
  };
}

async function collectPendingBalanceMismatches({ businessId, sampleLimit }) {
  const clientsRef = db.collection(`businesses/${businessId}/clients`);
  const scanLimit = Math.max(sampleLimit * SCAN_MULTIPLIER, sampleLimit);
  const clientsSnap = await clientsRef
    .where('client.pendingBalance', '>', 0)
    .limit(scanLimit)
    .get();

  const issues = [];
  const processedClients = new Set();

  const evaluateClient = async (clientId, storedPending, clientData) => {
    const arSnap = await db
      .collection(`businesses/${businessId}/accountsReceivable`)
      .where('clientId', '==', clientId)
      .where('isActive', '==', true)
      .get();
    let expected = 0;
    arSnap.docs.forEach((docSnap) => {
      expected += safeNumber(docSnap.data()?.arBalance);
    });
    const diff = Math.abs(storedPending - expected);
    if (diff > EPSILON && issues.length < sampleLimit) {
      issues.push({
        clientId,
        clientName: clientData?.name || clientData?.client?.name || null,
        storedPending,
        expectedPending: expected,
        diff,
      });
    }
  };

  for (const docSnap of clientsSnap.docs) {
    if (issues.length >= sampleLimit) break;
    const storedPending = safeNumber(docSnap.get('client.pendingBalance'));
    processedClients.add(docSnap.id);
    await evaluateClient(docSnap.id, storedPending, docSnap.data()?.client);
  }

  if (issues.length < sampleLimit) {
    const activeAccountsSnap = await db
      .collection(`businesses/${businessId}/accountsReceivable`)
      .where('isActive', '==', true)
      .orderBy('updatedAt', 'desc')
      .limit(scanLimit)
      .get();

    for (const docSnap of activeAccountsSnap.docs) {
      if (issues.length >= sampleLimit) break;
      const clientId = docSnap.data()?.clientId;
      if (!clientId || processedClients.has(clientId)) continue;
      const clientSnap = await db
        .doc(`businesses/${businessId}/clients/${clientId}`)
        .get();
      const storedPending = safeNumber(
        clientSnap.get('client.pendingBalance') || 0,
      );
      processedClients.add(clientId);
      await evaluateClient(clientId, storedPending, clientSnap.data()?.client);
    }
  }

  return {
    scanned: processedClients.size,
    sampleLimit,
    issues,
  };
}

async function collectInstallmentPaymentIssues({
  businessId,
  sinceTs,
  sampleLimit,
}) {
  const scanLimit = Math.max(sampleLimit * SCAN_MULTIPLIER, sampleLimit);
  const paymentsRef = db.collection(
    `businesses/${businessId}/accountsReceivableInstallmentPayments`,
  );
  let paymentsQuery = paymentsRef.orderBy('createdAt', 'desc');
  if (sinceTs) {
    paymentsQuery = paymentsRef
      .where('createdAt', '>=', sinceTs)
      .orderBy('createdAt', 'desc');
  }
  const paymentsSnap = await paymentsQuery.limit(scanLimit).get();

  const missingPayments = [];
  const checkedPaymentIds = new Set();

  for (const docSnap of paymentsSnap.docs) {
    if (missingPayments.length >= sampleLimit) break;
    const data = docSnap.data() || {};
    const paymentId = data.paymentId;
    if (!paymentId || checkedPaymentIds.has(paymentId)) continue;
    checkedPaymentIds.add(paymentId);

    const paymentDoc = await db
      .doc(`businesses/${businessId}/accountsReceivablePayments/${paymentId}`)
      .get();
    if (paymentDoc.exists) continue;

    missingPayments.push({
      installmentPaymentId: docSnap.id,
      paymentId,
      arId: data.arId || null,
      installmentId: data.installmentId || null,
      amount: safeNumber(data.paymentAmount),
      createdAt: toMillis(docSnap.get('createdAt')),
    });
  }

  return {
    scanned: paymentsSnap.size,
    sampleLimit,
    issues: missingPayments,
  };
}

async function collectInvoicesWithAnomalies({
  businessId,
  sinceTs,
  sampleLimit,
}) {
  const scanLimit = Math.max(sampleLimit * SCAN_MULTIPLIER, sampleLimit);
  const invoicesRef = db.collection(`businesses/${businessId}/invoices`);
  let query = invoicesRef.orderBy('createdAt', 'desc');
  if (sinceTs) {
    query = invoicesRef
      .where('createdAt', '>=', sinceTs)
      .orderBy('createdAt', 'desc');
  }
  const querySnap = await query.limit(scanLimit).get();

  const issues = [];
  for (const docSnap of querySnap.docs) {
    if (issues.length >= sampleLimit) break;
    const invoice = docSnap.data() || {};
    const paymentMethod =
      invoice.paymentMethod || invoice.paymentProfile?.method;
    const balanceDue = safeNumber(invoice.balanceDue);
    const isCancelled = invoice.status === 'cancelled';
    const meta = getReceivableMetadata(invoice);

    let issueType = null;

    // Check 1: Credit payment but not in AR
    if (
      !meta.isAdded &&
      paymentMethod &&
      String(paymentMethod).toLowerCase() === 'credit' &&
      !isCancelled
    ) {
      issueType = 'credit_payment_missing_ar';
    }

    // Check 2: Balance due but not in AR
    if (!meta.isAdded && balanceDue > 0 && !isCancelled) {
      issueType = 'balance_due_missing_ar';
    }

    // Check 3: Cancelled but has AR (requires checking AR collection, expensive, maybe skip for now or do a quick check)
    // For now, let's focus on the first two.

    if (issueType) {
      // Verify if it really doesn't exist in AR collection to be sure
      const hasAr = await hasAccountsReceivable({
        businessId,
        invoiceId: docSnap.id,
      });

      if (!hasAr) {
        issues.push({
          ...normalizeInvoiceBasicInfo(
            docSnap.id,
            invoice,
            docSnap.get('createdAt'),
          ),
          issueType,
          paymentMethod,
          balanceDue,
        });
      }
    }
  }

  return {
    scanned: querySnap.size,
    sampleLimit,
    issues,
  };
}

export const auditAccountsReceivableHttp = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST')
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

    const { businessId } = req.body || {};
    if (!businessId || typeof businessId !== 'string') {
      return res
        .status(400)
        .json({ error: 'businessId es requerido en el cuerpo' });
    }

    await assertUserAccess({
      authUid: authContext?.uid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
    });
    await assertBusinessSubscriptionAccess({
      businessId,
      action: 'read',
      requiredModule: 'accountsReceivable',
    });

    const sampleLimit = clampNumber(
      req.body?.sampleLimit,
      5,
      MAX_SAMPLE_LIMIT,
      DEFAULT_SAMPLE_LIMIT,
    );
    const hasDaysParam =
      req.body?.days !== undefined && req.body?.days !== null;
    const days = hasDaysParam
      ? clampNumber(req.body?.days, 1, MAX_DAYS, DEFAULT_DAYS)
      : null;
    let sinceMs = null;
    if (Number(req.body?.since) && Number(req.body?.since) > 0) {
      sinceMs = Number(req.body?.since);
    } else if (days != null) {
      sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
    }
    const sinceTs = sinceMs ? Timestamp.fromMillis(sinceMs) : null;

    const meter = timer();
    const [
      missingReceivables,
      inconsistentAccounts,
      pendingBalance,
      orphanPayments,
      setupOutbox,
      anomalies,
    ] = await Promise.all([
      collectInvoicesMissingReceivable({
        businessId,
        sinceTs,
        sampleLimit,
      }),
      collectReceivableInconsistencies({
        businessId,
        sinceTs,
        sampleLimit,
      }),
      collectPendingBalanceMismatches({
        businessId,
        sampleLimit,
      }),
      collectInstallmentPaymentIssues({
        businessId,
        sinceTs,
        sampleLimit,
      }),
      collectReceivableOutboxTasks({
        businessId,
        sinceTs,
        sampleLimit,
      }),
      collectInvoicesWithAnomalies({
        businessId,
        sinceTs,
        sampleLimit,
      }),
    ]);

    const payload = {
      businessId,
      generatedAt: new Date().toISOString(),
      rangeStart: sinceMs,
      executionTimeMs: meter.end(),
      limits: {
        sampleLimit,
        days,
      },
      indicators: {
        invoicesMissingReceivable: missingReceivables,
        receivableInconsistencies: inconsistentAccounts,
        pendingBalanceMismatch: pendingBalance,
        orphanInstallmentPayments: orphanPayments,
        receivableOutboxTasks: setupOutbox,
        invoiceAnomalies: anomalies,
      },
    };

    return res.status(200).json(payload);
  } catch (error) {
    if (error instanceof https.HttpsError) {
      const status = mapHttpsErrorToHttpStatus(error.code);
      return res.status(status).json({
        error: error.message,
        code: error.code,
      });
    }

    logger.error('[auditAccountsReceivableHttp] unexpected error', {
      error: error?.message,
      stack: error?.stack,
    });
    return res.status(500).json({
      error: 'Error interno al generar la auditoría de CxC',
    });
  }
});
