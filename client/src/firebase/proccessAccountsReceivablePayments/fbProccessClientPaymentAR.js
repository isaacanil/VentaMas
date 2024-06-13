import { fbApplyPartialPaymentToAccount } from "./fbApplyPartialPaymentToAccount";
import { fbPayBalanceForAccounts } from "./fbPayBalanceForAccounts";
import { fbPayAllInstallmentsForAccount } from "./fbPayAllInstallmentsForAccount";
import { fbPayActiveInstallmentForAccount } from "./fbPayActiveInstallmentForAccount";

export const fbProcessClientPaymentAR = async (user, paymentDetails) => {
    const { paymentScope, paymentOption, clientId, totalAmount, paymentMethods } = paymentDetails;


    const paymentHandlers = {
        balance: async () => await fbPayBalanceForAccounts({ user, paymentDetails }),
        account: {
            installment: async () => await fbPayActiveInstallmentForAccount({ user, paymentDetails }),
            balance: async () => await fbPayAllInstallmentsForAccount({ user, paymentDetails }),
            partial: async () => await fbApplyPartialPaymentToAccount({ user, paymentDetails })
        }
    };

    try {
        if (paymentScope === 'balance') {
            await paymentHandlers.balance();
            console.log('Balance payment processed successfully.');
        } else if (paymentScope === 'account' && paymentHandlers.account[paymentOption]) {
            await paymentHandlers.account[paymentOption](clientId, paymentDetails.arId, totalAmount);
            console.log(`${paymentOption} payment processed successfully.`);
        } else {
            throw new Error('Invalid payment option.');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error; // Re-throw the error after logging it
    }
};