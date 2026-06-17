export const RECEIVABLE_PAYMENT_THRESHOLD = 0.01;

export const asReceivableRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const safeReceivableNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundReceivableAmount = (value) =>
  Math.round(safeReceivableNumber(value) * 100) / 100;

export const resolveReceivableAccountTotal = (account) => {
  const accountRecord = asReceivableRecord(account);
  const paymentState = asReceivableRecord(accountRecord.paymentState);
  return roundReceivableAmount(
    paymentState.total ??
      accountRecord.totalReceivable ??
      accountRecord.totalAmount ??
      accountRecord.amount,
  );
};

export const resolveReceivableAccountBalance = (account) => {
  const accountRecord = asReceivableRecord(account);
  const paymentState = asReceivableRecord(accountRecord.paymentState);
  return roundReceivableAmount(
    paymentState.balance ??
      accountRecord.arBalance ??
      resolveReceivableAccountTotal(accountRecord),
  );
};

export const resolveReceivableInstallmentAmount = (installment) => {
  const installmentRecord = asReceivableRecord(installment);
  return roundReceivableAmount(
    installmentRecord.installmentAmount ??
      installmentRecord.amount ??
      installmentRecord.installmentBalance,
  );
};

export const resolveReceivableInstallmentBalance = (installment) => {
  const installmentRecord = asReceivableRecord(installment);
  return roundReceivableAmount(
    installmentRecord.installmentBalance ??
      installmentRecord.balance ??
      installmentRecord.installmentAmount ??
      installmentRecord.amount,
  );
};

export const countRemainingReceivableInstallments = (installments) =>
  (Array.isArray(installments) ? installments : []).filter(
    (installment) =>
      resolveReceivableInstallmentBalance(installment) >
      RECEIVABLE_PAYMENT_THRESHOLD,
  ).length;

export const resolveNextReceivablePaymentAt = (installments) => {
  const activeInstallments = (Array.isArray(installments) ? installments : [])
    .filter(
      (installment) =>
        resolveReceivableInstallmentBalance(installment) >
        RECEIVABLE_PAYMENT_THRESHOLD,
    )
    .sort((left, right) => {
      const leftValue = safeReceivableNumber(
        left?.installmentDate?.toMillis?.() ?? left?.installmentDate,
      );
      const rightValue = safeReceivableNumber(
        right?.installmentDate?.toMillis?.() ?? right?.installmentDate,
      );
      return leftValue - rightValue;
    });

  return activeInstallments[0]?.installmentDate ?? null;
};
