// functions/src/modules/invoice/controllers/invoice.controller.js
import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { processInvoiceData } from '../services/invoice.service.js';
/**
 * Endpoint callable para la funcionalidad de Invoice.
 * Retorna un mensaje y los datos procesados por el servicio.
 */
export const handleInvoiceRequest = https.onCall(async (req, context) => {  const traceId =
    context.rawRequest?.headers["x-cloud-trace-context"]?.split("/")[0] ??
    nanoid();

    const rawBody = context.rawRequest?.rawBody?.toString();
    logger.debug('⇢ Raw request body', {
      structuredData: true,
      traceId,
      rawBody,
    });

  logger.info('↪ handleInvoiceRequest invoked', {
    structuredData: true,
    traceId,
    uid: req?.user?.uid || "no se esta pasando el uid",
    payloadKeys: Object.keys(req),
    payload: req,
  });
  const invoice = req?.data;
  logger.info('Invoice data', {
    structuredData: true,
    traceId,
    invoiceData: JSON.stringify(invoice),
  });
  // 3) Validación de inputs mínimos
  const {
    user,
    cart,
    client,
    accountsReceivable,
    insuranceAR,
    insuranceAuth,
    ncfType,
    taxReceiptEnabled = false,
    dueDate = null,
  } = invoice || {};

  const insuranceEnabled = invoice?.cart?.insuranceEnabled || false;

  if (!user || !cart) {
    logger.error('Missing required parameters', { traceId, userPresent: !!user, cartPresent: !!cart, data: req.data });
    throw new https.HttpsError('invalid-argument', 'Se requieren los campos `user` y `cart`');
  }

  // 4) Validar tipos de taxReceipt
  if (taxReceiptEnabled && (typeof ncfType !== 'string' || !ncfType.trim())) {
    logger.error('Invalid NCF type', { traceId, taxReceiptEnabled, ncfType });
    throw new https.HttpsError('invalid-argument', '`ncfType` inválido cuando `taxReceiptEnabled=true`');
  }

  try {
    const result = await processInvoiceData({
      user,
      cart,
      client,
      accountsReceivable,
      insuranceAR,
      insuranceAuth,
      ncfType,
      taxReceiptEnabled,
      dueDate,
      insuranceEnabled,
      traceId
    });

    // 6) Validar resultado de servicio
    if (result.status === 'error') {
      logger.warn('Invoice service returned error', { traceId, reason: result.message });
      throw new https.HttpsError('failed-precondition', result.message);
    }

    // 7) Log de éxito
    logger.info('✔ handleInvoiceRequest completed', {
      structuredData: true,
      traceId,
      invoiceId: result.processed?.invoice?.id,
    });

    // 8) Responder al cliente
    return {
      status: 'success',
      data: result.invoice
    };

  } catch (err) {
    if (err instanceof https.HttpsError) {
      throw err;
    } else {
      logger.error('Unhandled error in  handleInvoiceRequest', { traceId, err });
      throw new https.HttpsError(
        'internal',                                  // código de error estándar
        'Error interno al procesar la factura',      // mensaje de usuario
        {                                            // objeto de detalles opcional
          traceId,
          error: err,
          message: err instanceof Error
            ? err.message
            : String(err)
        }
      );
    }
  }
});
