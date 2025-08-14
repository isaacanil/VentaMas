import { fbApplyPartialPaymentToAccount } from "./fbApplyPartialPaymentToAccount";
import { fbPayBalanceForAccounts } from "./fbPayBalanceForAccounts";
import { fbPayAllInstallmentsForAccount } from "./fbPayAllInstallmentsForAccount";
import { fbPayActiveInstallmentForAccount } from "./fbPayActiveInstallmentForAccount";
import { fbConsumeCreditNotes } from "../creditNotes/fbConsumeCreditNotes";

export const fbProcessClientPaymentAR = async (user, paymentDetails, callback) => {
    const { paymentScope, paymentOption, clientId, totalAmount, paymentMethods } = paymentDetails;

    // Debug logging para ver qué datos llegan
    console.log("🔍 Debug - Processing AR payment with details:", {
        paymentScope,
        paymentOption,
        clientId,
        totalAmount,
        paymentMethodsLength: paymentMethods?.length,
        arId: paymentDetails.arId,
        totalPaid: paymentDetails.totalPaid,
        hasCreditNotes: paymentDetails.creditNotePayment?.length > 0
    });

    const paymentPayload = { user, paymentDetails };
    const paymentHandlers = {
        balance: async () => await fbPayBalanceForAccounts(paymentPayload),
        account: {
            installment: async () => await fbPayActiveInstallmentForAccount(paymentPayload),
            balance: async () => await fbPayAllInstallmentsForAccount(paymentPayload),
            partial: async () => await fbApplyPartialPaymentToAccount(paymentPayload)
        }
    };

    try {
        let receipt;
        if (paymentScope === 'balance') {
            receipt = await paymentHandlers.balance();
        } else if (paymentScope === 'account' && paymentHandlers.account[paymentOption]) {
            receipt = await paymentHandlers.account[paymentOption]();
        } else {
            throw new Error('Invalid payment option.');
        }
        // Consumir notas de crédito si se aplicaron
        if (paymentDetails?.creditNotePayment?.length > 0) {
            try {
                // Para AR payments quizás no haya una sola factura; usaremos el primer invoiceId del receipt si existe
                const firstInvoiceId = receipt?.accounts?.[0]?.invoiceId || null;
                await fbConsumeCreditNotes(user, paymentDetails.creditNotePayment, firstInvoiceId, { source: 'AR_PAYMENT' });
            } catch (e) {
                console.error('Error consuming credit notes in AR payment:', e);
            }
        }

        callback(receipt)
        return receipt;
    } catch (error) {
        console.error('❌ Error processing AR payment:', {
            error: error.message,
            stack: error.stack,
            paymentScope,
            paymentOption,
            clientId,
            arId: paymentDetails.arId,
            totalPaid: paymentDetails.totalPaid,
            errorCode: error.code,
            errorDetails: error.details
        });
        throw error; // Re-throw the error after logging it
    }
};