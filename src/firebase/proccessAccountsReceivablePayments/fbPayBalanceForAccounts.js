import { doc, writeBatch, getDoc } from 'firebase/firestore';

import { fbAddAccountReceivablePaymentReceipt } from '../accountsReceivable/fbAddAccountReceivablePaymentReceipt';
import { fbAddPayment } from '../accountsReceivable/payment/fbAddPayment';
import { db } from '../firebaseconfig';
import { fbGetInvoice } from '../invoices/fbGetInvoice';

import {
  getSortedClientAccountsAR,
  getActiveInstallmentsByArId,
  processInstallmentPayment,
  updateAccountReceivableState,
  updateInvoiceTotals,
  validateBasicPaymentParams,
  validateAccountHasPendingBalance,
} from './arPaymentUtils';
import { roundToTwoDecimals } from './financeUtils';

export const fbPayBalanceForAccounts = async ({ user, paymentDetails }) => {
  const { clientId, paymentMethods } = paymentDetails;

  // Validar parámetros básicos usando la utilidad
  const validation = validateBasicPaymentParams({
    user,
    clientId,
    totalPaid: paymentDetails.totalPaid,
    paymentMethods,
  });

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { totalPaidFloat } = validation;
  let remainingAmount = totalPaidFloat;

  try {
    const accounts = await getSortedClientAccountsAR(user, clientId);

    // Crear el pago usando fbAddPayment (igual que en fbPayActiveInstallmentForAccount)
    const payment = await fbAddPayment(user, paymentDetails);

    const batch = writeBatch(db);

    const paymentReceipt = {
      accounts: [],
      totalAmount: totalPaidFloat,
      paymentMethod: paymentMethods,
      change: 0,
    };

    for (let account of accounts) {
      if (remainingAmount <= 0) break;

      // 🔍 VALIDACIÓN: Verificar que cada cuenta tenga balance pendiente
      const accountValidation = await validateAccountHasPendingBalance(
        user,
        account.id,
      );

      if (!accountValidation.isValid) {
        console.warn(
          `⚠️ Skipping account ${account.id}: ${accountValidation.error}`,
        );
        continue; // Continuar con la siguiente cuenta en lugar de fallar
      }

      console.log(
        `✅ Account ${account.id} has pending balance: ${accountValidation.balance}`,
      );

      const accountInstallments = await getActiveInstallmentsByArId(
        user,
        account.id,
      );
      let accountTotalPaid = 0;
      const paidInstallments = [];
      const paidInstallmentIds = []; // Para rastrear IDs de cuotas pagadas completamente

      for (let installment of accountInstallments) {
        if (remainingAmount <= 0) break;

        // Verificar que la cuota existe
        const installmentRef = doc(
          db,
          'businesses',
          user.businessID,
          'accountsReceivableInstallments',
          installment.id,
        );
        const installmentDoc = await getDoc(installmentRef);
        if (!installmentDoc.exists()) {
          console.error(
            `Installment document ${installment.id} does not exist.`,
          );
          continue;
        }

        // Usar la utilidad para procesar el pago de la cuota
        const result = processInstallmentPayment(batch, {
          user,
          installment,
          remainingAmount,
          paymentId: payment.id,
          clientId,
          arId: account.id,
        });

        remainingAmount = roundToTwoDecimals(
          remainingAmount - result.amountToApply,
        );
        accountTotalPaid = roundToTwoDecimals(
          accountTotalPaid + result.amountToApply,
        );
        account.arBalance = roundToTwoDecimals(
          account.arBalance - result.amountToApply,
        );

        // Si la cuota fue pagada completamente, agregar su ID
        if (result.isPaid) {
          paidInstallmentIds.push(installment.id);
        }

        paidInstallments.push({
          number: installment.installmentNumber,
          id: installment.id,
          amount: roundToTwoDecimals(result.amountToApply),
          status: result.isPaid ? 'paid' : 'partial',
          remainingBalance: result.newInstallmentBalance,
        });
      }

      // Actualizar la cuenta usando updateAccountReceivableState para incluir paidInstallments
      updateAccountReceivableState(batch, {
        businessId: user.businessID,
        arId: account.id,
        totalPaid: accountTotalPaid,
        newArBalance: account.arBalance,
        paidInstallmentIds,
        existingPaidInstallments: account.paidInstallments || [],
      });

      const invoice = await fbGetInvoice(user.businessID, account.invoiceId);
      // Actualizar la factura con los pagos realizados
      if (invoice) {
        updateInvoiceTotals(batch, {
          businessId: user.businessID,
          invoiceId: account.invoiceId,
          amountPaid: accountTotalPaid,
          invoice,
          paymentMethods,
        });
      }

      const invoiceNumber =
        invoice?.data?.numberID ||
        invoice?.numberID ||
        account?.invoiceNumber ||
        null;

      paymentReceipt.accounts.push({
        arNumber: account.numberId,
        arId: account.id,
        invoiceNumber: invoiceNumber ? String(invoiceNumber) : 'N/A',
        invoiceId: account.invoiceId || invoice?.data?.id || invoice?.id,
        paidInstallments,
        remainingInstallments:
          account?.totalInstallments - paidInstallments.length,
        totalInstallments: account?.totalInstallments,
        totalPaid: accountTotalPaid,
        arBalance: account?.arBalance,
      });
    }

    await batch.commit();

    paymentReceipt.change = remainingAmount > 0 ? remainingAmount : 0;

    return fbAddAccountReceivablePaymentReceipt({
      user,
      clientId,
      paymentReceipt,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
