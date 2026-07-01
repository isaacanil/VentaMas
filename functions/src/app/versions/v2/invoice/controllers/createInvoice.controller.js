import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db } from '../../../../core/config/firebase.js';
import { resolveIdempotencyKey } from '../utils/idempotency.util.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../billing/config/limitOperations.config.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';
import { resolveRequiredCallableActorUid } from './invoiceCallableAuth.util.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../../../../modules/invoice/utils/invoiceValidation.js'),
      import('../services/orchestrator.service.js'),
      import('../../../../modules/cashCount/utils/cashCountQueries.js'),
      import('../../../../modules/cashCount/utils/cashCountCheck.js'),
      import('../../accounting/utils/accountingRollout.util.js'),
      import('../utils/hash.util.js'),
    ]).then(
      ([
        validation,
        orchestrator,
        cashCountQueries,
        cashCountCheck,
        accountingRollout,
        hashUtil,
      ]) => {
        const cashCountHelpers = cashCountQueries?.default ?? cashCountQueries;
        return {
          validateInvoiceCart: validation.validateInvoiceCart,
          validateInvoiceCartAgainstCatalog:
            validation.validateInvoiceCartAgainstCatalog,
          createPendingInvoice: orchestrator.createPendingInvoice,
          getOpenCashCountDoc: cashCountHelpers?.getOpenCashCountDoc,
          checkOpenCashCount: cashCountCheck.checkOpenCashCount,
          getPilotAccountingSettingsForBusiness:
            accountingRollout.getPilotAccountingSettingsForBusiness,
          stableHash: hashUtil.stableHash,
        };
      },
    );
  }
  return depsPromise;
}

async function loadInvoiceProductCatalog({ businessId, productId }) {
  const productRef = db.doc(`businesses/${businessId}/products/${productId}`);
  const saleUnitsRef = db.collection(
    `businesses/${businessId}/products/${productId}/saleUnits`,
  );
  const [productSnap, saleUnitsSnap] = await Promise.all([
    productRef.get(),
    saleUnitsRef.get(),
  ]);

  if (!productSnap.exists) {
    return { exists: false, product: null, saleUnits: [] };
  }

  return {
    exists: true,
    product: {
      id: productSnap.id,
      ...(productSnap.data?.() || {}),
    },
    saleUnits: Array.isArray(saleUnitsSnap?.docs)
      ? saleUnitsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data?.() || {}),
        }))
      : [],
  };
}

/**
 * V2 - Endpoint (callable) para iniciar la creacion de una factura.
 * Primera fase: solo garantiza idempotencia y crea la factura en estado 'pending'.
 * Requiere header 'Idempotency-Key' o campo 'idempotencyKey' en el body (data).
 */
export const createInvoiceV2 = onCall(async (request) => {
  const data = request?.data || {};
  const rawRequest = request?.rawRequest;
  const traceId =
    rawRequest?.headers?.['x-cloud-trace-context']?.split('/')?.[0] ??
    nanoid();
  try {
    const {
      validateInvoiceCart,
      validateInvoiceCartAgainstCatalog,
      createPendingInvoice,
      getOpenCashCountDoc,
      checkOpenCashCount,
      getPilotAccountingSettingsForBusiness,
      stableHash,
    } = await loadDeps();
    let idempotencyKey = resolveIdempotencyKey({ rawRequest, data });
    const authUid = await resolveRequiredCallableActorUid(request);
    const businessId = data?.businessId || data?.user?.businessID;
    const userId = authUid;

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
        throw new HttpsError(
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
      throw new HttpsError(
        'invalid-argument',
        'businessId y userId son requeridos',
      );
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
      logger.warn('createInvoiceV2 blocked by subscription policy', {
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
      logger.warn('NCF enabled but type missing', { traceId });
      throw new HttpsError(
        'invalid-argument',
        'ncfType es requerido cuando NCF esta habilitado',
      );
    }

    const accountingSettings = await getPilotAccountingSettingsForBusiness(
      businessId,
    );
    const validationOptions = {
      functionalCurrency: accountingSettings?.functionalCurrency,
    };

    const validation = validateInvoiceCart(data?.cart, validationOptions);
    if (!validation?.isValid) {
      throw new HttpsError(
        'failed-precondition',
        'Carrito invalido: ' + (validation?.message || 'error'),
      );
    }
    const catalogValidation = await validateInvoiceCartAgainstCatalog(
      data?.cart,
      {
        businessId,
        loadProductCatalog: loadInvoiceProductCatalog,
        ...validationOptions,
      },
    );
    if (!catalogValidation?.isValid) {
      throw new HttpsError(
        'failed-precondition',
        'Carrito invalido: ' + (catalogValidation?.message || 'error'),
        catalogValidation,
      );
    }
    const trustedPayload = catalogValidation?.trustedCart
      ? {
          ...data,
          cart: catalogValidation.trustedCart,
        }
      : data;

    const isAddedToReceivables = !!trustedPayload?.cart?.isAddedToReceivables;
    if (isAddedToReceivables) {
      const arData = trustedPayload?.accountsReceivable || null;
      const totalInstallments = Number(arData?.totalInstallments);
      if (
        !arData ||
        !Number.isFinite(totalInstallments) ||
        totalInstallments <= 0
      ) {
        throw new HttpsError(
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
      throw new HttpsError(
        'failed-precondition',
        'No hay cuadre de caja abierto',
      );
    }

    const result = await createPendingInvoice({
      businessId,
      userId,
      payload: trustedPayload,
      idempotencyKey,
      cashCountId,
    });

    logger.info('createInvoiceV2 completed', {
      traceId,
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
      businessId,
      userId,
    });

    return {
      status: 'pending',
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    };
  } catch (err) {
    if (err instanceof HttpsError || typeof err?.code === 'string') {
      throw err;
    }
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
    throw new HttpsError(
      'internal',
      'Error interno al iniciar la factura',
      { traceId },
    );
  }
});
