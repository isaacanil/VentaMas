import { DateTime } from 'luxon';
export function calculateRemainingBalance(totalDue, paymentMade) {
    return totalDue - paymentMade;
}
export function calculateAmountPerInstallment(remainingBalance, numberOfInstallments) {
    if (numberOfInstallments > 0) {
        return Number(remainingBalance) / Number(numberOfInstallments);
    }
    return 0; // Evita la división por cero
}
export function calculateTotalCredit(remainingBalance) {
    return remainingBalance;
}
export function calculateTotalActiveBalance(accounts) {
    console.log("active balance cuentas ", accounts)
    return accounts
        .filter(account => account.isActive && account.arBalance > 0)
        .reduce((total, account) => total + account.arBalance, 0);
};


export const convertAccountsData = (data) => {
    console.log(data)
    return data.map(account => {
        const accountNumber = account.invoiceId;
        const date = DateTime.fromSeconds(account.createdAt.seconds).toFormat('dd/MM/yyyy');
        let frequency;
        if (account.paymentFrequency === 'monthly') {
            frequency = 'Mensual';
        } else if (account.paymentFrequency === 'weekly') {
            frequency = 'Semanal';
        } else {
            frequency = account.paymentFrequency; // En caso de que haya otra frecuencia no contemplada
        }
        const balance = account.arBalance;
        const installments = account.totalInstallments;
        const isActive = account.isActive;

        return {
            ...account,
            accountNumber,
            date,
            frequency,
            balance,
            installments,
            isActive
        };
    });
};

export const PAYMENT_SCOPE = {
    balance: "Pago a balance",
    account: "Pago a cuenta"
}
export const PAYMENT_OPTIONS = {
    installment: {
        name: "installment",
        text: "Cuota"
    },
    accountBalance: {
        name: "balance",
        text: "Balance de cuenta"
    },
    accountPayment: {
        name: "partial",
        text: "Abono a cuenta"
    }
};


