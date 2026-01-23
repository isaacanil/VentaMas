import { doc, writeBatch, getDoc, arrayUnion } from 'firebase/firestore';

import { fbAddAccountReceivablePaymentReceipt } from '@/firebase/accountsReceivable/fbAddAccountReceivablePaymentReceipt';
import { fbAddPayment } from '@/firebase/accountsReceivable/payment/fbAddPayment';
import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { db } from '@/firebase/firebaseconfig';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';
import type { UserWithBusiness } from '@/types/users';

import {
  type PaymentDetails,
  getSortedClientAccountsAR,
  getActiveInstallmentsByArId,
  processInstallmentPayment,
  updateAccountReceivableState,
  updateInvoiceTotals,
  validateBasicPaymentParams,
  validateAccountHasPendingBalance,
} from './arPaymentUtils';
import { roundToTwoDecimals } from './financeUtils';

type BalancePaymentDetails = PaymentDetails & { clientId: string };

export const fbPayBalanceForAccounts = async ({
  user,
  paymentDetails,
}: {
  user: UserWithBusiness;
  paymentDetails: BalancePaymentDetails;
}): Promise<Awaited<ReturnType<typeof fbAddAccountReceivablePaymentReceipt>>> => {
  const { clientId, paymentMethods } = paymentDetails;

  // Validar parámetros básicos usando la utilidad
  const validation = validateBasicPaymentParams({
    user,
    clientId,
    totalPaid: paymentDetails.totalPaid,
    paymentMethods,
  });

  if (!validation.isValid) {
    throw new Error(validation.error ?? 'Invalid payment parameters');
  }

  const totalPaidFloat = validation.totalPaidFloat ?? 0;
  let remainingAmount = totalPaidFloat;

  try {
    const accounts = await getSortedClientAccountsAR(user, clientId);

    // Crear el pago usando fbAddPayment (igual que en fbPayActiveInstallmentForAccount)
    const payment = await fbAddPayment(user, paymentDetails);

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
      if (
        error instanceof Error &&
        error.message.startsWith('No se puede procesar el pago')
      ) {
        throw error;
      }
      console.warn('Error checking open cash count:', error);
    }

    const batch = writeBatch(db);

    if (openCashCountId) {
      const cashCountRef = doc(
        db,
        'businesses',
        user.businessID,
        'cashCounts',
        openCashCountId,
      );
      batch.update(cashCountRef, {
        'cashCount.receivablePayments': arrayUnion({
          paymentId: payment.id,
          amount: Number(totalPaidFloat),
          method: paymentMethods,
          date: new Date().toISOString(),
          clientId: clientId || null,
          arId: null, // Balance payment covers multiple ARs, so arId is null or we could list them
        }),
      });
    }

    const paymentReceipt = {
      accounts: [],
      totalAmount: totalPaidFloat,
      paymentMethod: paymentMethods,
      change: 0,
    };

    for (const account of accounts) {
      if (remainingAmount <= 0) break;

      // 🔍 VALIDACIÓN: Verificar que cada cuenta tenga balance pendiente
      const accountValidation = await validateAccountHasPendingBalance(
        user,
        account.id,
      );

      if (!accountValidation.isValid || !accountValidation.account) {
        console.warn(
          `⚠️ Skipping account ${account.id}: ${accountValidation.error}`,
        );
        continue; // Continuar con la siguiente cuenta en lugar de fallar
      }

      const accountBalance = accountValidation.balance ?? 0;
      console.log(
        `✅ Account ${account.id} has pending balance: ${accountBalance}`,
      );

      const accountInstallments = await getActiveInstallmentsByArId(
        user,
        account.id,
      );
      let accountTotalPaid = 0;
      const paidInstallments: Array<{
        number?: number | string;
        id: string;
        amount: number;
        status: string;
        remainingBalance: number;
      }> = [];
      const paidInstallmentIds: string[] = []; // Para rastrear IDs de cuotas pagadas completamente

      for (const installment of accountInstallments) {
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

      const invoiceId = account.invoiceId ?? '';
      const invoice = await fbGetInvoice(user.businessID, invoiceId);
      // Actualizar la factura con los pagos realizados
      if (invoice) {
        updateInvoiceTotals(batch, {
          businessId: user.businessID,
          invoiceId,
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
