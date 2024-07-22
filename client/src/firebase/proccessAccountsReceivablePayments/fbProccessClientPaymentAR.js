import { fbApplyPartialPaymentToAccount } from "./fbApplyPartialPaymentToAccount";
import { fbPayBalanceForAccounts } from "./fbPayBalanceForAccounts";
import { fbPayAllInstallmentsForAccount } from "./fbPayAllInstallmentsForAccount";
import { fbPayActiveInstallmentForAccount } from "./fbPayActiveInstallmentForAccount";

export const fbProcessClientPaymentAR = async (user, paymentDetails, callback) => {
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
        let receipt;
        if (paymentScope === 'balance') {
            receipt = await paymentHandlers.balance();
        } else if (paymentScope === 'account' && paymentHandlers.account[paymentOption]) {
            receipt = await paymentHandlers.account[paymentOption](clientId, paymentDetails.arId, totalAmount);
        } else {
            throw new Error('Invalid payment option.');
        }
        callback(receipt)
        return receipt;
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error; // Re-throw the error after logging it
    }
};