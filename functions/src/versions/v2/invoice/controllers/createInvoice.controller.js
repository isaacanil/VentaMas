import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';
import { validateInvoiceCart } from '../../../modules/invoice/utils/invoiceValidation.js';
import { createPendingInvoice } from '../services/orchestrator.service.js';
import getCashCount from '../../../modules/cashCount/utils/cashCountQueries.js';
import { checkOpenCashCount } from '../../../modules/cashCount/utils/cashCountCheck.js';

/**
 * V2 - Endpoint (callable) para iniciar la creación de una factura.
 * Primera fase: sólo garantiza idempotencia y crea la factura en estado 'pending'.
 * Requiere header `Idempotency-Key` o campo `idempotencyKey` en el body (data).
 */
export const createInvoiceV2 = https.onCall(async (data, context) => {
  const traceId = context.rawRequest?.headers?.['x-cloud-trace-context']?.split('/')?.[0] ?? nanoid();
  try {
    if (!context?.auth?.uid) {
      throw new https.HttpsError('unauthenticated', 'Autenticación requerida');
    }
    const idempotencyKey = context.rawRequest?.headers?.['idempotency-key'] || data?.idempotencyKey;
    const businessId = data?.businessId || data?.user?.businessID;
    const userId = data?.userId || data?.user?.uid;

    if (!idempotencyKey) {
      logger.warn('Missing Idempotency-Key', { traceId });
      throw new https.HttpsError('invalid-argument', 'Idempotency-Key es requerido');
    }
    if (!businessId || !userId) {
      logger.warn('Missing businessId or userId', { traceId, businessId: !!businessId, userId: !!userId });
      throw new https.HttpsError('invalid-argument', 'businessId y userId son requeridos');
    }
    if (userId !== context.auth.uid) {
      logger.warn('UserId mismatch with auth uid', { traceId, userId, authUid: context.auth.uid });
      throw new https.HttpsError('permission-denied', 'userId no coincide con el usuario autenticado');
    }

    // Validación ligera de NCF si viene habilitado
    const ncfEnabled = !!(data?.ncf?.enabled || data?.taxReceiptEnabled);
    const ncfType = data?.ncf?.type || data?.ncfType;
    if (ncfEnabled && !ncfType) {
      logger.warn('NCF enabled but type missing', { traceId });
      throw new https.HttpsError('invalid-argument', 'ncfType es requerido cuando NCF está habilitado');
    }

    // Validar carrito mínimo
    const validation = validateInvoiceCart(data?.cart);
    if (!validation?.isValid) {
      throw new https.HttpsError('failed-precondition', `Carrito inválido: ${validation?.message || 'error'}`);
    }

    // Validar datos de cuentas por cobrar cuando el carrito las requiere
    const isAddedToReceivables = !!data?.cart?.isAddedToReceivables;
    if (isAddedToReceivables) {
      const arData = data?.accountsReceivable || null;
      const totalInstallments = Number(arData?.totalInstallments);
      if (!arData || !Number.isFinite(totalInstallments) || totalInstallments <= 0) {
        throw new https.HttpsError('invalid-argument', 'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true');
      }
    }
    // Validar cuadre de caja abierto (early validation)
    try {
      const user = { businessID: businessId, uid: userId };
      const ccSnap = await getCashCount.getOpenCashCountDoc(user);
      await checkOpenCashCount({ cashCountSnap: ccSnap, user });
    } catch (e) {
      throw new https.HttpsError('failed-precondition', 'No hay cuadre de caja abierto');
    }

    const result = await createPendingInvoice({
      businessId,
      userId,
      payload: data,
      idempotencyKey,
    });

    logger.info('createInvoiceV2 completed', { traceId, invoiceId: result.invoiceId, reused: result.alreadyExists });
    return {
      status: 'pending',
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    };
  } catch (err) {
    if (err instanceof https.HttpsError) throw err;
    logger.error('Unhandled error in createInvoiceV2', { traceId, err });
    throw new https.HttpsError('internal', 'Error interno al iniciar la factura', {
      traceId,
      message: err?.message || String(err),
    });
  }
});

