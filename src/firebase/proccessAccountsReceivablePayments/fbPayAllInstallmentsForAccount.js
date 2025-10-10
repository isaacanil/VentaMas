import { doc, runTransaction } from "firebase/firestore";

import { db } from '../firebaseconfig';
import { fbGetInvoice } from "../invoices/fbGetInvoice";

import { 
    getInstallmentsByArId,
    createPaymentRecord,
    processInstallmentPayment,
    updateAccountReceivableState,
    updateInvoiceTotals,
    createFullPaymentReceipt,
    formatPaidInstallments,
    safeNumber,
    safeString,
    validateFirestoreData,
    validateAccountHasPendingBalance,
    validatePaymentAmount
} from "./arPaymentUtils";
import { THRESHOLD, roundToTwoDecimals } from "./financeUtils";

export const fbPayAllInstallmentsForAccount = async ({ user, paymentDetails }) => {
    const { totalPaid, arId, clientId, paymentMethods, comments } = paymentDetails;

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
            
            // Si el pago excede el balance, podríamos permitirlo con advertencia
            if (paymentValidation.exceedsBalance) {
                console.warn("⚠️ Payment exceeds balance, will be adjusted to account balance");
                // Opcionalmente podrías ajustar el monto aquí
                // totalPaid = paymentValidation.adjustedAmount;
            } else {
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
        
        if (!accountInstallments || accountInstallments.length === 0) {
            throw new Error("No installments found for the account");
        }
        
        // Ya no necesitamos obtener la cuenta de nuevo, la tenemos de la validación
        // const accountsReceivableRef = doc(db, "businesses", user.businessID, "accountsReceivable", arId);
        // const accountSnapshot = await getDoc(accountsReceivableRef);

        // if (!accountSnapshot.exists()) {
        //     throw new Error("Account not found");
        // }

        // const accountData = accountSnapshot.data(); // Esta línea se elimina porque ya tenemos accountData

        return await runTransaction(db, async (transaction) => {
            let remainingAmount = totalPaid;
            
            // Crear el registro de pago usando la utilidad
            const paymentId = createPaymentRecord(transaction, { user, paymentDetails });

            const paidInstallments = [];
            let initialArBalance = 0;

            for (let installment of accountInstallments) {
                initialArBalance += installment.installmentBalance;

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
                    paidInstallments.push(installment.id);
                }

                remainingAmount = roundToTwoDecimals(remainingAmount - result.amountToApply);
            }

            let newArBalance = roundToTwoDecimals(initialArBalance - totalPaid);

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
                paidInstallmentIds: paidInstallments,
                existingPaidInstallments: accountData.paidInstallments || []
            });

            // Obtener la factura y actualizarla
            const invoice = await fbGetInvoice(user.businessID, accountData.invoiceId);
            if (invoice && invoice.data) {
                updateInvoiceTotals(transaction, {
                    businessId: user.businessID,
                    invoiceId: accountData.invoiceId,
                    amountPaid: totalPaid,
                    invoice
                });
            }

            // Crear el recibo de pago usando las utilidades
            const paidInstallmentsData = formatPaidInstallments(paidInstallments, accountInstallments);
            
            const accountReceiptData = {
                arNumber: safeString(accountData.numberId),
                arId: safeString(accountData.id),
                invoiceNumber: safeString(invoice?.data?.numberID || invoice?.numberID),
                invoiceId: safeString(invoice?.data?.id || invoice?.id),
                paidInstallments: paidInstallmentsData || [],
                remainingInstallments: safeNumber(accountData.totalInstallments) - safeNumber(accountData.paidInstallments?.length) - safeNumber(paidInstallments.length),
                totalInstallments: safeNumber(accountData.totalInstallments),
                totalPaid: safeNumber(totalPaid),
                arBalance: safeNumber(newArBalance),
            };

            // Debug logging para identificar campos undefined
            console.log("🔍 Debug - Account data for receipt:", {
                arNumber: accountReceiptData.arNumber,
                arId: accountReceiptData.arId,
                invoiceNumber: accountReceiptData.invoiceNumber,
                invoiceId: accountReceiptData.invoiceId,
                totalInstallments: accountReceiptData.totalInstallments,
                paidInstallmentsCount: paidInstallmentsData?.length,
                paymentId,
                clientId,
                user: user?.businessID
            });
            
            const paymentReceipt = createFullPaymentReceipt({
                paymentId: safeString(paymentId),
                clientId: safeString(clientId),
                arId: safeString(arId),
                user,
                totalAmount: safeNumber(totalPaid),
                paymentMethods: paymentMethods || [],
                accounts: [accountReceiptData],
                change: safeNumber(remainingAmount)
            });

            // Debug logging para el recibo completo
            console.log("🔍 Debug - Payment receipt before save:", {
                receiptId: paymentReceipt.receiptId,
                paymentId: paymentReceipt.paymentId,
                clientId: paymentReceipt.clientId,
                businessId: paymentReceipt.businessId,
                accountsLength: paymentReceipt.accounts?.length,
                hasUndefinedFields: Object.values(paymentReceipt).some(val => val === undefined)
            });

            // Validar y limpiar datos antes de guardar en Firestore
            const validatedReceipt = validateFirestoreData(paymentReceipt, 'payment receipt');

            // Guardar el recibo en Firestore
            const receiptRef = doc(db, "businesses", user.businessID, "paymentReceipts", validatedReceipt.receiptId);
            transaction.set(receiptRef, validatedReceipt);

            return paymentReceipt;
        });
    } catch (error) {
        console.error("Error processing payment for all installments:", error);
        throw error;
    }
};