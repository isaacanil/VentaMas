import { collection, doc, setDoc, Timestamp, writeBatch } from "firebase/firestore";
import { nanoid } from "nanoid";

import { defaultInstallmentPaymentsAR } from "../../schema/accountsReceivable/installmentPaymentsAR";
import { fbAddAccountReceivablePaymentReceipt } from "../accountsReceivable/fbAddAccountReceivablePaymentReceipt";
import { fbAddPayment } from "../accountsReceivable/payment/fbAddPayment";
import { db } from "../firebaseconfig";
import { fbGetInvoice } from "../invoices/fbGetInvoice";

import { 
    getOldestActiveInstallmentByArId, 
    validatePaymentAmounts,
    createAccountReceiptData,
    validateAccountHasPendingBalance,
    validatePaymentAmount
} from "./arPaymentUtils";
import { THRESHOLD, roundToTwoDecimals } from "./financeUtils";

// Function to process the payment for the oldest active installment
export const fbPayActiveInstallmentForAccount = async ({ user, paymentDetails }) => {
    try {
        const { clientId, totalAmount: paymentAmount, arId, paymentMethods, comments, totalPaid } = paymentDetails;

        // 🔍 VALIDACIÓN 1: Validar que la cuenta tenga balance pendiente
        console.log("🔍 Debug - Validating account balance for arId:", arId);
        const accountValidation = await validateAccountHasPendingBalance(user, arId);
        
        if (!accountValidation.isValid) {
            console.warn("⚠️ Account validation failed:", accountValidation.error);
            throw new Error(`Account validation failed: ${accountValidation.error}`);
        }

        const account = accountValidation.account;
        const currentBalance = accountValidation.balance;

        console.log("✅ Account validation passed:", {
            arId,
            currentBalance,
            isActive: account.isActive,
            isClosed: account.isClosed
        });

        // 🔍 VALIDACIÓN 2: Validar montos usando la utilidad
        const validation = validatePaymentAmounts({ 
            totalAmount: paymentAmount, 
            totalPaid,
            creditNotePayment: paymentDetails.creditNotePayment 
        });
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        const { paymentAmountFloat } = validation.amounts;

        // 🔍 VALIDACIÓN 3: Validar que el monto del pago sea válido
        const paymentValidation = validatePaymentAmount(paymentAmountFloat, currentBalance);
        
        if (!paymentValidation.isValid) {
            console.warn("⚠️ Payment amount validation failed:", paymentValidation.error);
            if (!paymentValidation.exceedsBalance) {
                throw new Error(`Payment validation failed: ${paymentValidation.error}`);
            }
        }

        // Usar utilidades para obtener los datos
        // const account = await getClientAccountById(user, arId); // Ya no necesario, tenemos de la validación
        // if (!account) {
        //     throw new Error('Account not found');
        // }

        const installment = await getOldestActiveInstallmentByArId(user, account.id);
        if (!installment) {
            throw new Error('No active installment found for the account');
        }

        const payment = await fbAddPayment(user, paymentDetails);

        const batch = writeBatch(db);

        // Handle the balance during payment
        let amountToApply = roundToTwoDecimals(Math.min(paymentAmountFloat, parseFloat(installment.installmentBalance ?? 0)));
        let newInstallmentBalance = roundToTwoDecimals(parseFloat(installment.installmentBalance ?? 0) - amountToApply);
        let newAccountBalance = roundToTwoDecimals(parseFloat(account.arBalance ?? 0) - amountToApply);

        // Adjust for any small rounding difference
        if (Math.abs(newAccountBalance) < 0.01) {
            newAccountBalance = 0;
        }
        if (Math.abs(newInstallmentBalance) < 0.01) {
            newInstallmentBalance = 0;
        }

        const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", account.id);
        const installmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.id);
        const installmentPaymentRef = doc(collection(db, "businesses", user.businessID, "accountsReceivableInstallmentPayments"));

        batch.update(installmentRef, {
            installmentBalance: newInstallmentBalance,
            isActive: newInstallmentBalance > 0
        });

        if (newInstallmentBalance <= THRESHOLD) {
            const updatedPaidInstallments = [...(account.paidInstallments || []), installment.id];
            batch.update(accountsReceivableRef, {
                arBalance: newAccountBalance,
                lastPaymentDate: Timestamp.now(),
                lastPayment: amountToApply,
                isActive: newAccountBalance > THRESHOLD,
                isClosed: newAccountBalance <= THRESHOLD,
                paidInstallments: updatedPaidInstallments
            });
        }

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

        // Obtener la factura relacionada una vez confirmado el batch
        const invoice = await fbGetInvoice(user.businessID, account.invoiceId);

        // Update related invoice totals after batch
        if (invoice) {
            const invoiceRef = doc(db, "businesses", user.businessID, "invoices", account.invoiceId);
            const invoiceData = { ...invoice };
            const previousPaid = invoiceData.totalPaid || 0;
            invoiceData.totalPaid = roundToTwoDecimals(amountToApply + previousPaid);
            invoiceData.balanceDue = roundToTwoDecimals(invoiceData.totalAmount - invoiceData.totalPaid);
            invoiceData.status = invoiceData.balanceDue <= THRESHOLD;
            await setDoc(invoiceRef, invoiceData, { merge: true });
        }

        // Check if there's a small remaining balance due to rounding
        const remainingAmount = roundToTwoDecimals(paymentAmountFloat - amountToApply);
        if (remainingAmount > 0) {
            const adjustmentBatch = writeBatch(db); // Create a new batch for the adjustment
            const adjustmentRef = doc(db, "businesses", user.businessID, "accountsReceivableInstallments", installment.id);
            adjustmentBatch.update(adjustmentRef, {
                installmentBalance: roundToTwoDecimals(newInstallmentBalance + remainingAmount)
            });
            await adjustmentBatch.commit();
            console.log(`Payment completed with adjustment. Remaining amount adjusted: ${remainingAmount}`);
        } else {
            console.log('Payment completed with no remaining amount.');
        }
        
        // Create payment receipt data usando utilidades
        const paidInstallmentsData = [{
            number: installment.installmentNumber,
            id: installment.id,
            amount: amountToApply
        }];

        const accountReceiptData = createAccountReceiptData({
            account,
            invoice,
            paidInstallments: paidInstallmentsData,
            totalPaid: amountToApply,
            newBalance: newAccountBalance
        });

        const paymentReceipt = {
            accounts: [accountReceiptData],
            totalAmount: paymentAmount,
            paymentMethod: paymentMethods,
            change: roundToTwoDecimals(paymentAmountFloat - amountToApply)
        };

        const receipt = await fbAddAccountReceivablePaymentReceipt({ user, clientId, paymentReceipt });

        return receipt

    } catch (error) {
        console.error("Error processing payment for oldest active installment:", error);
        throw error;
    }
};
