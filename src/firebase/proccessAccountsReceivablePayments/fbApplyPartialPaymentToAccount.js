import { runTransaction, doc, arrayUnion } from 'firebase/firestore';

import { fbAddAccountReceivablePaymentReceipt } from '@/firebase/accountsReceivable/fbAddAccountReceivablePaymentReceipt';
import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { db } from '@/firebase/firebaseconfig';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';

import {
  getInstallmentsByArId,
  createPaymentRecord,
  processInstallmentPayment,
  updateAccountReceivableState,
  updateInvoiceTotals,
  formatPaidInstallments,
  validateAccountHasPendingBalance,
  validatePaymentAmount,
} from './arPaymentUtils';
import { THRESHOLD, roundToTwoDecimals } from './financeUtils';

export const fbApplyPartialPaymentToAccount = async ({
  user,
  paymentDetails,
}) => {
  const {
    totalPaid,
    clientId,
    arId,
    paymentMethods,
    comments: _comments,
  } = paymentDetails;

  try {
    // 🔍 VALIDACIÓN 1: Validar que la cuenta tenga balance pendiente
    console.log('🔍 Debug - Validating account balance for arId:', arId);
    const accountValidation = await validateAccountHasPendingBalance(
      user,
      arId,
    );

    if (!accountValidation.isValid) {
      console.warn('⚠️ Account validation failed:', accountValidation.error);
      throw new Error(`Account validation failed: ${accountValidation.error}`);
    }

    const accountData = accountValidation.account;
    const currentBalance = accountValidation.balance;

    console.log('✅ Account validation passed:', {
      arId,
      currentBalance,
      isActive: accountData.isActive,
      isClosed: accountData.isClosed,
    });

    // 🔍 VALIDACIÓN 2: Validar que el monto del pago sea válido
    const paymentValidation = validatePaymentAmount(totalPaid, currentBalance);

    if (!paymentValidation.isValid) {
      console.warn(
        '⚠️ Payment amount validation failed:',
        paymentValidation.error,
      );
      if (!paymentValidation.exceedsBalance) {
        throw new Error(
          `Payment validation failed: ${paymentValidation.error}`,
        );
      }
    }

    console.log('✅ Payment amount validation passed:', {
      requestedAmount: totalPaid,
      accountBalance: currentBalance,
      exceedsBalance: paymentValidation.exceedsBalance,
    });

    // Fetch all necessary data outside the transaction
    const accountInstallments = await getInstallmentsByArId(user, arId);

    // Ya no necesitamos obtener la cuenta de nuevo, la tenemos de la validación
    // const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", arId);
    // const accountSnapshot = await getDoc(accountsReceivableRef);

    // if (!accountSnapshot.exists()) {
    //     throw new Error("Account not found");
    // }

    // const accountData = accountSnapshot.data(); // Eliminamos esta línea

    const invoice = await fbGetInvoice(user.businessID, accountData.invoiceId);

    let openCashCountId = null;
    try {
      const { state, cashCount } = await checkOpenCashReconciliation(user);

      if (state === 'closing') {
        throw new Error('No se puede procesar el pago: La caja está en proceso de cierre.');
      }

      if (state === 'closed') {
        throw new Error('No se puede procesar el pago: No hay un cuadre de caja abierto.');
      }

      if (state === 'open' && cashCount?.id) {
        openCashCountId = cashCount.id;
      }
    } catch (error) {
      if (error.message.startsWith('No se puede procesar el pago')) {
        throw error;
      }
      console.warn('Error checking open cash count:', error);
    }

    const transactionResult = await runTransaction(db, async (transaction) => {
      let remainingAmount = totalPaid;

      // Crear el registro de pago usando la utilidad
      const paymentId = createPaymentRecord(transaction, {
        user,
        paymentDetails,
      });

      if (openCashCountId) {
        const cashCountRef = doc(
          db,
          'businesses',
          user.businessID,
          'cashCounts',
          openCashCountId,
        );
        // Assuming paymentDetails.paymentMethods is an array of methods.
        // If it's just one method object or similar, ensure consistency.
        // The schema says 'receivablePayments' entry has: amount, method, date, paymentId.
        transaction.update(cashCountRef, {
          'cashCount.receivablePayments': arrayUnion({
            paymentId,
            amount: Number(totalPaid),
            method: paymentMethods,
            date: new Date().toISOString(), // Or Timestamp.now() if preferred, ensuring consistency with other files
            clientId: clientId || null,
            arId: arId || null,
          }),
        });
      }

      const paidInstallments = new Set();

      for (const installment of accountInstallments) {
        if (remainingAmount <= THRESHOLD) break;

        // Usar la utilidad para procesar el pago de la cuota
        const result = processInstallmentPayment(transaction, {
          user,
          installment,
          remainingAmount,
          paymentId,
          clientId,
          arId,
        });

        if (result.isPaid) {
          paidInstallments.add(installment.id);
        }

        remainingAmount = roundToTwoDecimals(
          remainingAmount - result.amountToApply,
        );
      }

      let newArBalance = roundToTwoDecimals(accountData.arBalance - totalPaid);

      if (newArBalance < 0) {
        remainingAmount = -newArBalance;
        newArBalance = 0;
      } else {
        remainingAmount = 0;
      }

      // Actualizar el estado de la cuenta usando la utilidad
      updateAccountReceivableState(transaction, {
        businessId: user.businessID,
        arId,
        totalPaid,
        newArBalance,
        paidInstallmentIds: Array.from(paidInstallments),
        existingPaidInstallments: accountData.paidInstallments || [],
      });

      // Actualizar la factura relacionada
      if (invoice) {
        updateInvoiceTotals(transaction, {
          businessId: user.businessID,
          invoiceId: accountData.invoiceId,
          amountPaid: totalPaid,
          invoice,
          paymentMethods,
        });
      }

      // Crear el recibo de pago usando las utilidades
      const paidInstallmentsData = formatPaidInstallments(
        Array.from(paidInstallments),
        accountInstallments,
      );

      const invoiceNumber =
        invoice?.data?.numberID || invoice?.numberID || accountData?.invoiceNumber;
      const receiptInvoiceId =
        accountData.invoiceId || invoice?.data?.id || invoice?.id || null;

      const paymentReceipt = {
        accounts: [
          {
            arNumber: accountData.numberId,
            invoiceNumber: invoiceNumber ? String(invoiceNumber) : 'N/A',
            invoiceId: receiptInvoiceId,
            arId: accountData.id,
            paidInstallments: paidInstallmentsData,
            remainingInstallments:
              accountData.totalInstallments -
              (accountData.paidInstallments?.length || 0) -
              paidInstallments.size,
            totalInstallments: accountData.totalInstallments,
            totalPaid: totalPaid,
            arBalance: newArBalance,
          },
        ],
        totalAmount: totalPaid,
        paymentMethod: paymentMethods,
        change: remainingAmount,
      };

      return paymentReceipt;
    });

    // Guardar el recibo de pago en la base de datos
    return fbAddAccountReceivablePaymentReceipt({
      user,
      clientId,
      paymentReceipt: transactionResult,
    });
  } catch (error) {
    console.error('Error processing partial payment for account:', error);
    throw error;
  }
};
