import { https, logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/https';
import { nanoid } from 'nanoid';

import { resolveIdempotencyKey } from '../utils/idempotency.util.js';
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
      import('../utils/hash.util.js'),
    ]).then(
      ([
        validation,
        orchestrator,
        cashCountQueries,
        cashCountCheck,
        hashUtil,
      ]) => {
        const cashCountHelpers = cashCountQueries?.default ?? cashCountQueries;
        return {
          validateInvoiceCart: validation.validateInvoiceCart,
          createPendingInvoice: orchestrator.createPendingInvoice,
          getOpenCashCountDoc: cashCountHelpers?.getOpenCashCountDoc,
          checkOpenCashCount: cashCountCheck.checkOpenCashCount,
          stableHash: hashUtil.stableHash,
        };
      },
    );
  }
  return depsPromise;
}

/**
 * V2 - Endpoint (callable) para iniciar la creacion de una factura.
 * Primera fase: solo garantiza idempotencia y crea la factura en estado 'pending'.
 * Requiere header 'Idempotency-Key' o campo 'idempotencyKey' en el body (data).
 */
export const createInvoiceV2 = onCall(async ({ data }, context) => {
  const traceId =
    context.rawRequest?.headers?.['x-cloud-trace-context']?.split('/')?.[0] ??
    nanoid();
  try {
    const {
      validateInvoiceCart,
      createPendingInvoice,
      getOpenCashCountDoc,
      checkOpenCashCount,
      stableHash,
    } = await loadDeps();
    const rawRequest = context.rawRequest;
    let idempotencyKey = resolveIdempotencyKey({ rawRequest, data });
    const authUid = context?.auth?.uid || null;
    const businessId = data?.businessId || data?.user?.businessID;
    const userId = data?.userId || data?.user?.uid;

    // Fallback automático si no se envía Idempotency-Key: usar cartId o hash estable del carrito
    if (!idempotencyKey) {
      const cartId = data?.cart?.id || data?.cartId || data?.cartIdRef;
      if (cartId) {
        idempotencyKey = `cart:${cartId}`;
      } else if (data?.cart) {
        try {
          idempotencyKey = 'hash:' + stableHash(data.cart);
        } catch {
          /* fallback to validation below */
        }
      }
      if (!idempotencyKey) {
        logger.warn('Missing Idempotency-Key and cannot derive fallback', {
          traceId,
        });
        throw new https.HttpsError(
          'invalid-argument',
          'Idempotency-Key es requerido',
        );
      } else {
        logger.info('Derived Idempotency-Key fallback', {
          traceId,
          idempotencyKey,
        });
      }
    }
    if (!businessId || !userId) {
      logger.warn('Missing businessId or userId', {
        traceId,
        businessId: !!businessId,
        userId: !!userId,
      });
      throw new https.HttpsError(
        'invalid-argument',
        'businessId y userId son requeridos',
      );
    }

    if (authUid && userId !== authUid) {
      throw new https.HttpsError(
        'permission-denied',
        'userId no coincide con el usuario autenticado',
      );
    }
    await assertUserAccess({
      authUid: authUid || userId,
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
      logger.warn('createInvoiceV2 blocked by subscription policy', {
        traceId,
        businessId,
        userId: authUid || userId,
        error: subscriptionError,
      });
      throw subscriptionError;
    }

    const ncfEnabled = !!(data?.ncf?.enabled || data?.taxReceiptEnabled);
    const ncfType = data?.ncf?.type || data?.ncfType;
    if (ncfEnabled && !ncfType) {
      logger.warn('NCF enabled but type missing', { traceId });
      throw new https.HttpsError(
        'invalid-argument',
        'ncfType es requerido cuando NCF esta habilitado',
      );
    }

    const validation = validateInvoiceCart(data?.cart);
    if (!validation?.isValid) {
      throw new https.HttpsError(
        'failed-precondition',
        'Carrito invalido: ' + (validation?.message || 'error'),
      );
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
        throw new https.HttpsError(
          'invalid-argument',
          'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true',
        );
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
      logger.warn('Cash count validation failed', {
        traceId,
        reason: error?.message ?? error,
      });
      throw new https.HttpsError(
        'failed-precondition',
        'No hay cuadre de caja abierto',
      );
    }

    const result = await createPendingInvoice({
      businessId,
      userId,
      payload: data,
      idempotencyKey,
      cashCountId,
    });

    logger.info('createInvoiceV2 completed', {
      traceId,
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    });
    logger.info('data', { traceId, data: { ...data, cart: 'omitted' } });
    logger.info('idempotencyKey', { traceId, idempotencyKey });
    logger.info('result', { traceId, result });

    return {
      status: 'pending',
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    };
  } catch (err) {
    if (err instanceof https.HttpsError) throw err;
    // Normalize error for logging
    let errorInfo = {};
    if (err instanceof Error) {
      errorInfo = {
        message: err.message,
        stack: err.stack,
        name: err.name,
      };
    } else if (typeof err === 'object' && err !== null) {
      errorInfo = { ...err };
    } else {
      errorInfo = { message: String(err) };
    }
    logger.error('Unhandled error in createInvoiceV2', { traceId, errorInfo });
    throw new https.HttpsError(
      'internal',
      'Error interno al iniciar la factura',
      {
        traceId,
        message: errorInfo.message || String(err),
        stack: errorInfo.stack,
        name: errorInfo.name,
      },
    );
  }
});
