import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db } from '../../../../core/config/firebase.js';
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
import { handleHttpCorsPreflightAndMethod } from '../../http/httpCors.util.js';
import { mapHttpsErrorToHttpStatus } from '../../http/httpError.util.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../../../../modules/invoice/utils/invoiceValidation.js'),
      import('../services/orchestrator.service.js'),
      import('../../../../modules/cashCount/utils/cashCountQueries.js'),
      import('../../../../modules/cashCount/utils/cashCountCheck.js'),
      import('../../accounting/utils/accountingRollout.util.js'),
    ]).then(([
      validation,
      orchestrator,
      cashCountQueries,
      cashCountCheck,
      accountingRollout,
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
      };
    });
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

export const createInvoiceV2Http = https.onRequest(async (req, res) => {
  const httpGuardHandled = handleHttpCorsPreflightAndMethod(req, res, {
    allowedMethod: 'POST',
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization, X-Session-Token, Idempotency-Key',
  });
  if (httpGuardHandled) {
    return;
  }

  const traceId =
    req.headers['x-cloud-trace-context']?.toString()?.split('/')?.[0] ??
    nanoid();
  try {
    const {
      validateInvoiceCart,
      validateInvoiceCartAgainstCatalog,
      createPendingInvoice,
      getOpenCashCountDoc,
      checkOpenCashCount,
      getPilotAccountingSettingsForBusiness,
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

    const accountingSettings = await getPilotAccountingSettingsForBusiness(
      businessId,
    );
    const validationOptions = {
      functionalCurrency: accountingSettings?.functionalCurrency,
    };

    const validation = validateInvoiceCart(data?.cart, validationOptions);
    if (!validation?.isValid) {
      return res.status(412).json({
        error: 'Carrito invalido: ' + (validation?.message || 'error'),
      });
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
      return res.status(412).json({
        error: 'Carrito invalido: ' + (catalogValidation?.message || 'error'),
        code: catalogValidation?.code,
      });
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
      payload: trustedPayload,
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
      return res.status(mapHttpsErrorToHttpStatus(err.code)).json({
        error: err.message,
        code: err.code,
      });
    }
    logger.error('Unhandled error in createInvoiceV2Http', { traceId, err });
    return res.status(500).json({
      error: 'Error interno al iniciar la factura',
      traceId,
    });
  }
});
