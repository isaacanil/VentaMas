import { logger, https } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { manageReceivableAccounts } from '../../accountReceivable/services/accountReceivable.service.js';
import { collectReceivablePrereqs } from '../../accountReceivable/services/getAccountReceivable.service.js';
import { manageInsuranceReceivableAccounts } from '../../accountReceivable/services/insuranceAccountReceivable.service.js';
import { checkOpenCashCount } from '../../cashCount/utils/cashCountCheck.js';
import { retrieveAndUpdateClient } from '../../client/services/clientAdmin.service.js';
import { collectInventoryPrereqs } from '../../Inventory/services/getInventory.service.js';
import { adjustProductInventory } from '../../Inventory/services/Inventory.service.js';
import { getAndUpdateTaxReceipt } from '../../taxReceipt/services/taxReceiptAdmin.service.js';
import { validateInvoiceCart } from '../utils/invoiceValidation.js';

import {
  generateFinalInvoice,
  generateInvoiceFromPreorder,
} from './invoiceGeneration.service.js';
import { collectInvoicePrereqs } from './invoiceRead.service.js';

/**
 * Procesa los datos recibidos del frontend relacionados con una factura.
 * @throws {https.HttpsError}
 * @returns {Promise<Object>} processedData
 */
export async function processInvoiceData({
  user,
  cart,
  client,
  accountsReceivable,
  insuranceAR,
  insuranceAuth,
  ncfType,
  taxReceiptEnabled = false,
  dueDate = null,
  insuranceEnabled = false,
  traceId,
}) {
  logger.info('Processing invoice data in service', {
    traceId,
    user: user.uid,
  });

  // Validación inputs mínimos
  if (!user || !cart) {
    logger.error('Missing user or cart', { traceId });
    throw new https.HttpsError('invalid-argument', 'Se requieren user y cart');
  }

  // Validar carrito
  const cartValidation = validateInvoiceCart(cart);
  if (!cartValidation.isValid) {
    logger.error('Cart validation failed', {
      traceId,
      reason: cartValidation.message,
    });
    throw new https.HttpsError(
      'failed-precondition',
      `Carrito inválido: ${cartValidation.message}`,
    );
  }

  // Validar tipo de recibo fiscal
  if (taxReceiptEnabled && (typeof ncfType !== 'string' || !ncfType.trim())) {
    logger.error('Invalid ncfType', { traceId, ncfType });
    throw new https.HttpsError(
      'invalid-argument',
      '`ncfType` es obligatorio cuando `taxReceiptEnabled=true`',
    );
  }

  logger.info('1) Validations passed', { traceId });

  // Verificar cuadre de caja DENTRO de una transacción
  const { ncfCode, invoice } = await db.runTransaction(async (tx) => {
    logger.info('2) Transaction started', { traceId });

    const { cashCountSnap, taxReceiptSnap, clientSnap } =
      await collectInvoicePrereqs(tx, {
        user,
        cart,
        client,
        ncfType,
        taxReceiptEnabled,
      });

    const inventoryPrevreqs = await collectInventoryPrereqs(tx, {
      user,
      products: cart.products,
    });

    const { accountReceivableNextIDSnap, insurance } =
      await collectReceivablePrereqs(tx, {
        user,
        accountsReceivable,
        insuranceId: insuranceAR?.insuranceId,
      });

    // Verificar si el usuario tiene un cuadre de caja abierto
    const { cashCount, cashCountId } = await checkOpenCashCount({
      user,
      cashCountSnap,
    });

    // Verificar si el usuario tiene permisos para el cuadre de caja
    const code = await getAndUpdateTaxReceipt(tx, {
      user,
      taxReceiptEnabled,
      taxReceiptName: ncfType,
      taxReceiptSnap,
    });

    // Actualizar cliente
    const clientData = await retrieveAndUpdateClient(tx, {
      user,
      client,
      clientSnap,
    });

    const invoice = cart.preorderDetails?.isOrWasPreorder
      ? await generateInvoiceFromPreorder(tx, {
        user,
        cart,
        cashCountId,
        ncfCode: code,
        clientData,
        cashCountSnap,
      })
      : await generateFinalInvoice(tx, {
        user,
        cart,
        clientData,
        ncfCode: code,
        cashCountId,
        dueDate,
        cashCountSnap,
      });
    logger.info('Invoice generated (tx)', { traceId, invoiceId: invoice.id });

    await adjustProductInventory(tx, {
      user,
      products: cart.products,
      sale: invoice,
      inventoryPrevreqs,
    });
    logger.info('Inventory adjusted (tx)', { traceId });

    await manageReceivableAccounts(tx, {
      user,
      accountsReceivable,
      invoice,
      accountReceivableNextIDSnap,
    });
    logger.info('Receivables managed', { traceId });

    await manageInsuranceReceivableAccounts(tx, {
      user,
      insuranceAR,
      invoice,
      insuranceAuth,
      insurance,
      client,
      insuranceEnabled,
    });
    logger.info('Insurance receivables managed', { traceId });

    return { cashCount, ncfCode: code, clientData, invoice };
  });
  logger.info('Transaction completed', { traceId });

  return {
    message: 'Invoice processed successfully',
    invoice,
    processedAt: new Date().toISOString(),
    ncfCode,
  };
}
