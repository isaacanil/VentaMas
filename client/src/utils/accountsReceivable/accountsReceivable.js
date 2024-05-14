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
