import { runTransaction } from "firebase/firestore";

import { fbAddAccountReceivablePaymentReceipt } from "../accountsReceivable/fbAddAccountReceivablePaymentReceipt";
import { db } from "../firebaseconfig";
import { fbGetInvoice } from "../invoices/fbGetInvoice";

import { 
    getInstallmentsByArId,
    createPaymentRecord,
    processInstallmentPayment,
    updateAccountReceivableState,
    updateInvoiceTotals,
    formatPaidInstallments,
    validateAccountHasPendingBalance,
    validatePaymentAmount
} from "./arPaymentUtils";
import { THRESHOLD, roundToTwoDecimals } from "./financeUtils";

export const fbApplyPartialPaymentToAccount = async ({ user, paymentDetails }) => {
    const { totalPaid, clientId, arId, paymentMethods, comments } = paymentDetails;

    try {
        // 🔍 VALIDACIÓN 1: Validar que la cuenta tenga balance pendiente
        console.log("🔍 Debug - Validating account balance for arId:", arId);
        const accountValidation = await validateAccountHasPendingBalance(user, arId);
        
        if (!accountValidation.isValid) {
            console.warn("⚠️ Account validation failed:", accountValidation.error);
            throw new Error(`Account validation failed: ${accountValidation.error}`);
        }

        const accountData = accountValidation.account;
        const currentBalance = accountValidation.balance;

        console.log("✅ Account validation passed:", {
            arId,
            currentBalance,
            isActive: accountData.isActive,
            isClosed: accountData.isClosed
        });

        // 🔍 VALIDACIÓN 2: Validar que el monto del pago sea válido
        const paymentValidation = validatePaymentAmount(totalPaid, currentBalance);
        
        if (!paymentValidation.isValid) {
            console.warn("⚠️ Payment amount validation failed:", paymentValidation.error);
            if (!paymentValidation.exceedsBalance) {
                throw new Error(`Payment validation failed: ${paymentValidation.error}`);
            }
        }

        console.log("✅ Payment amount validation passed:", {
            requestedAmount: totalPaid,
            accountBalance: currentBalance,
            exceedsBalance: paymentValidation.exceedsBalance
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

        const transactionResult = await runTransaction(db, async (transaction) => {
            let remainingAmount = totalPaid;
            
            // Crear el registro de pago usando la utilidad
            const paymentId = createPaymentRecord(transaction, { user, paymentDetails });

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
                    arId
                });

                if (result.isPaid) {
                    paidInstallments.add(installment.id);
                }

                remainingAmount = roundToTwoDecimals(remainingAmount - result.amountToApply);
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
                existingPaidInstallments: accountData.paidInstallments || []
            });

            // Actualizar la factura relacionada
            if (invoice) {
                updateInvoiceTotals(transaction, {
                    businessId: user.businessID,
                    invoiceId: accountData.invoiceId,
                    amountPaid: totalPaid,
                    invoice
                });
            }

            // Crear el recibo de pago usando las utilidades
            const paidInstallmentsData = formatPaidInstallments(Array.from(paidInstallments), accountInstallments);

            const paymentReceipt = {
                accounts: [{
                    arNumber: accountData.numberId,
                    invoiceNumber: invoice?.numberID,
                    invoiceId: accountData.invoiceId,
                    arId: accountData.id,
                    paidInstallments: paidInstallmentsData,
                    remainingInstallments: accountData.totalInstallments - (accountData.paidInstallments?.length || 0) - paidInstallments.size,
                    totalInstallments: accountData.totalInstallments,
                    totalPaid: totalPaid,
                    arBalance: newArBalance,
                }],
                totalAmount: totalPaid,
                paymentMethod: paymentMethods,
                change: remainingAmount
            };

            return paymentReceipt;
        });

        // Guardar el recibo de pago en la base de datos
        return fbAddAccountReceivablePaymentReceipt({ 
            user, 
            clientId, 
            paymentReceipt: transactionResult 
        });
    } catch (error) {
        console.error("Error processing partial payment for account:", error);
        throw error;
    }
};