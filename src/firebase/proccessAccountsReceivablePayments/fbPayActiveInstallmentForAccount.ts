// @ts-nocheck
import {
  collection,
  doc,
  increment,
  Timestamp,
  updateDoc,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { fbAddAccountReceivablePaymentReceipt } from '@/firebase/accountsReceivable/fbAddAccountReceivablePaymentReceipt';
import { fbAddPayment } from '@/firebase/accountsReceivable/payment/fbAddPayment';
import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { db } from '@/firebase/firebaseconfig';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';
import { defaultInstallmentPaymentsAR } from '@/schema/accountsReceivable/installmentPaymentsAR';

import {
  getOldestActiveInstallmentByArId,
  validatePaymentAmounts,
  createAccountReceiptData,
  validateAccountHasPendingBalance,
  validatePaymentAmount,
  updateInvoiceTotals,
} from './arPaymentUtils';
import { THRESHOLD, roundToTwoDecimals } from './financeUtils';

// Function to process the payment for the oldest active installment
export const fbPayActiveInstallmentForAccount = async ({
  user,
  paymentDetails,
}) => {
  try {
    const {
      clientId,
      totalAmount: paymentAmount,
      arId,
      paymentMethods,
      comments: _comments,
      totalPaid,
    } = paymentDetails;

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

    const account = accountValidation.account;
    const currentBalance = accountValidation.balance;

    console.log('✅ Account validation passed:', {
      arId,
      currentBalance,
      isActive: account.isActive,
      isClosed: account.isClosed,
    });

    // 🔍 VALIDACIÓN 2: Validar montos usando la utilidad
    const validation = validatePaymentAmounts({
      totalAmount: paymentAmount,
      totalPaid,
      creditNotePayment: paymentDetails.creditNotePayment,
    });
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const { paymentAmountFloat } = validation.amounts;

    // 🔍 VALIDACIÓN 3: Validar que el monto del pago sea válido
    const paymentValidation = validatePaymentAmount(
      paymentAmountFloat,
      currentBalance,
    );

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

    // Usar utilidades para obtener los datos
    // const account = await getClientAccountById(user, arId); // Ya no necesario, tenemos de la validación
    // if (!account) {
    //     throw new Error('Account not found');
    // }

    const installment = await getOldestActiveInstallmentByArId(
      user,
      account.id,
    );
    if (!installment) {
      throw new Error('No active installment found for the account');
    }

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
      // If the error is one of our custom validation errors, re-throw it
      if (error.message.startsWith('No se puede procesar el pago')) {
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

      const receivablePaymentEntry = {
        paymentId: payment.id,
        amount: paymentAmountFloat,
        method: paymentMethods,
        date: Timestamp.now(),
        clientId: clientId || null,
        arId: arId || null,
      };

      batch.update(cashCountRef, {
        'cashCount.receivablePayments': arrayUnion(receivablePaymentEntry),
      });
    }

    // Handle the balance during payment
    let amountToApply = roundToTwoDecimals(
      Math.min(
        paymentAmountFloat,
        parseFloat(installment.installmentBalance ?? 0),
      ),
    );
    let newInstallmentBalance = roundToTwoDecimals(
      parseFloat(installment.installmentBalance ?? 0) - amountToApply,
    );
    let newAccountBalance = roundToTwoDecimals(
      parseFloat(account.arBalance ?? 0) - amountToApply,
    );

    // Adjust for any small rounding difference
    if (Math.abs(newAccountBalance) < 0.01) {
      newAccountBalance = 0;
    }
    if (Math.abs(newInstallmentBalance) < 0.01) {
      newInstallmentBalance = 0;
    }

    const accountsReceivableRef = doc(
      db,
      'businesses',
      user.businessID,
      'accountsReceivable',
      account.id,
    );
    const installmentRef = doc(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallments',
      installment.id,
    );
    const installmentPaymentRef = doc(
      collection(
        db,
        'businesses',
        user.businessID,
        'accountsReceivableInstallmentPayments',
      ),
    );

    batch.update(installmentRef, {
      installmentBalance: newInstallmentBalance,
      isActive: newInstallmentBalance > 0,
    });

    const paidInstallmentsSet = new Set(account.paidInstallments || []);
    if (newInstallmentBalance <= THRESHOLD) {
      paidInstallmentsSet.add(installment.id);
    }

    batch.update(accountsReceivableRef, {
      arBalance: newAccountBalance,
      lastPaymentDate: Timestamp.now(),
      lastPayment: amountToApply,
      isActive: newAccountBalance > THRESHOLD,
      isClosed: newAccountBalance <= THRESHOLD,
      ...(newInstallmentBalance <= THRESHOLD
        ? { paidInstallments: Array.from(paidInstallmentsSet) }
        : {}),
    });

    batch.set(installmentPaymentRef, {
      ...defaultInstallmentPaymentsAR,
      id: nanoid(),
      installmentId: installment.id,
      paymentId: payment.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      paymentAmount: amountToApply,
      createdBy: user.uid,
      updatedBy: user.uid,
      isActive: true,
      clientId: clientId,
      arId: account.id,
    });

    await batch.commit();

    if (clientId) {
      // Ajustar saldo inmediatamente mientras la función agregadora corre en background
      const clientRef = doc(
        db,
        'businesses',
        user.businessID,
        'clients',
        clientId,
      );
      await updateDoc(clientRef, {
        'client.pendingBalance': increment(-amountToApply),
      }).catch((err) => {
        console.warn(
          'No se pudo actualizar client.pendingBalance inmediatamente, quedará a cargo del trigger:',
          err,
        );
      });
    }

    // Obtener la factura relacionada una vez confirmado el batch
    const invoice = await fbGetInvoice(user.businessID, account.invoiceId);

    // Update related invoice totals after batch
    if (invoice) {
      const invoiceBatch = writeBatch(db);
      updateInvoiceTotals(invoiceBatch, {
        businessId: user.businessID,
        invoiceId: account.invoiceId,
        amountPaid: amountToApply,
        invoice,
        paymentMethods,
      });
      await invoiceBatch.commit();
    }

    // Check if there's a small remaining balance due to rounding
    const remainingAmount = roundToTwoDecimals(
      paymentAmountFloat - amountToApply,
    );
    if (remainingAmount > 0) {
      const adjustmentBatch = writeBatch(db); // Create a new batch for the adjustment
      const adjustmentRef = doc(
        db,
        'businesses',
        user.businessID,
        'accountsReceivableInstallments',
        installment.id,
      );
      adjustmentBatch.update(adjustmentRef, {
        installmentBalance: roundToTwoDecimals(
          newInstallmentBalance + remainingAmount,
        ),
      });
      await adjustmentBatch.commit();
      console.log(
        `Payment completed with adjustment. Remaining amount adjusted: ${remainingAmount}`,
      );
    } else {
      console.log('Payment completed with no remaining amount.');
    }

    // Create payment receipt data usando utilidades
    const paidInstallmentsData = [
      {
        number: installment.installmentNumber,
        id: installment.id,
        amount: amountToApply,
      },
    ];

    const accountReceiptData = createAccountReceiptData({
      account,
      invoice,
      paidInstallments: paidInstallmentsData,
      totalPaid: amountToApply,
      newBalance: newAccountBalance,
    });

    const paymentReceipt = {
      accounts: [accountReceiptData],
      totalAmount: paymentAmount,
      paymentMethod: paymentMethods,
      change: roundToTwoDecimals(paymentAmountFloat - amountToApply),
    };

    const receipt = await fbAddAccountReceivablePaymentReceipt({
      user,
      clientId,
      paymentReceipt,
    });

    return receipt;
  } catch (error) {
    console.error(
      'Error processing payment for oldest active installment:',
      error,
    );
    throw error;
  }
};
