import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { resolveIdempotencyKey } from '../utils/idempotency.util.js';
import {
  resolveHttpAuthUser,
  HttpAuthError,
} from '../../auth/services/httpAuth.service.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../billing/config/limitOperations.config.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../../../../modules/invoice/utils/invoiceValidation.js'),
      import('../services/orchestrator.service.js'),
      import('../../../../modules/cashCount/utils/cashCountQueries.js'),
      import('../../../../modules/cashCount/utils/cashCountCheck.js'),
    ]).then(([validation, orchestrator, cashCountQueries, cashCountCheck]) => {
      const cashCountHelpers = cashCountQueries?.default ?? cashCountQueries;
      return {
        validateInvoiceCart: validation.validateInvoiceCart,
        createPendingInvoice: orchestrator.createPendingInvoice,
        getOpenCashCountDoc: cashCountHelpers?.getOpenCashCountDoc,
        checkOpenCashCount: cashCountCheck.checkOpenCashCount,
      };
    });
  }
  return depsPromise;
}

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-Token, Idempotency-Key',
  );
}

const mapHttpsErrorToStatus = (code) => {
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
};

export const createInvoiceV2Http = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const traceId =
    req.headers['x-cloud-trace-context']?.toString()?.split('/')?.[0] ??
    nanoid();
  try {
    const {
      validateInvoiceCart,
      createPendingInvoice,
      getOpenCashCountDoc,
      checkOpenCashCount,
    } = await loadDeps();
    const idempotencyKey = resolveIdempotencyKey({
      rawRequest: req,
      data: req.body,
    });
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key es requerido' });
    }

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

    const data = req.body || {};
    const businessId = data?.businessId || data?.user?.businessID;
    const userId = data?.userId || data?.user?.uid || authUid;
    if (!businessId || !userId) {
      return res
        .status(400)
        .json({ error: 'businessId y userId son requeridos' });
    }
    if (userId !== authUid) {
      return res
        .status(403)
        .json({ error: 'userId no coincide con el usuario autenticado' });
    }
    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });
    try {
      await assertBusinessSubscriptionAccess({
        businessId,
        action: 'write',
        operation: LIMIT_OPERATION_KEYS.INVOICE_CREATE,
      });
    } catch (subscriptionError) {
      logger.warn('createInvoiceV2Http blocked by subscription policy', {
        traceId,
        businessId,
        userId: authUid,
        error: subscriptionError,
      });
      throw subscriptionError;
    }

    const ncfEnabled = !!(data?.ncf?.enabled || data?.taxReceiptEnabled);
    const ncfType = data?.ncf?.type || data?.ncfType;
    if (ncfEnabled && !ncfType) {
      return res
        .status(400)
        .json({ error: 'ncfType es requerido cuando NCF esta habilitado' });
    }

    const validation = validateInvoiceCart(data?.cart);
    if (!validation?.isValid) {
      return res.status(412).json({
        error: 'Carrito invalido: ' + (validation?.message || 'error'),
      });
    }

    const isAddedToReceivables = !!data?.cart?.isAddedToReceivables;
    if (isAddedToReceivables) {
      const arData = data?.accountsReceivable || null;
      const totalInstallments = Number(arData?.totalInstallments);
      if (
        !arData ||
        !Number.isFinite(totalInstallments) ||
        totalInstallments <= 0
      ) {
        return res.status(400).json({
          error:
            'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true',
        });
      }
    }
    let cashCountId = null;
    try {
      const user = { businessID: businessId, uid: userId };
      const ccSnap = await getOpenCashCountDoc?.(user);
      await checkOpenCashCount({ cashCountSnap: ccSnap, user });
      cashCountId =
        ccSnap?.get?.('cashCount.id') ||
        ccSnap?.id ||
        ccSnap?.get?.('id') ||
        null;
    } catch (error) {
      logger.warn('Cash count validation failed (HTTP)', {
        traceId,
        reason: error?.message ?? error,
      });
      return res.status(412).json({ error: 'No hay cuadre de caja abierto' });
    }

    const result = await createPendingInvoice({
      businessId,
      userId,
      payload: data,
      idempotencyKey,
      cashCountId,
    });

    logger.info('createInvoiceV2Http completed', {
      traceId,
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    });
    return res.status(200).json({
      status: 'pending',
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    });
  } catch (err) {
    if (err instanceof https.HttpsError) {
      return res.status(mapHttpsErrorToStatus(err.code)).json({
        error: err.message,
        code: err.code,
      });
    }
    logger.error('Unhandled error in createInvoiceV2Http', { traceId, err });
    return res.status(500).json({
      error: 'Error interno al iniciar la factura',
      traceId,
      message: err?.message || String(err),
    });
  }
});
