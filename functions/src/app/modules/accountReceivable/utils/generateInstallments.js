import { nanoid } from 'nanoid';

import { calculatePaymentDates } from './calculatePaymentDates.js';

const round2 = (n) => Math.round(n * 100) / 100;

const toFiniteNumber = (value) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numericValue) ? numericValue : null;
};

export function generateInstallments({ ar, user }) {
  const {
    totalInstallments: rawTotalInstallments = 0,
    totalReceivable: rawTotalReceivable = 0,
    paymentFrequency = 'monthly',
    paymentDate = null,
  } = ar || {};

  const totalInstallments = toFiniteNumber(rawTotalInstallments);
  const totalReceivable = toFiniteNumber(rawTotalReceivable);

  if (
    !Number.isInteger(totalInstallments) ||
    totalInstallments <= 0 ||
    totalReceivable === null
  ) {
    return [];
  }

  const { paymentDates } = calculatePaymentDates(
    paymentFrequency,
    totalInstallments,
    typeof paymentDate === 'number' ? paymentDate : null,
    { includeStartDate: true },
  );

  const part = round2(totalReceivable / totalInstallments);
  const diff = round2(totalReceivable - part * totalInstallments);
  const tsNow = Date.now();

  return paymentDates.map((msDate, i) => {
    const amount = i === totalInstallments - 1 ? round2(part + diff) : part;
    return {
      id: nanoid(),
      arId: ar.id,
      installmentNumber: i + 1,
      installmentAmount: amount,
      installmentBalance: amount,
      installmentDate: msDate,
      createdAt: tsNow,
      updatedAt: tsNow,
      createdBy: user?.uid,
      updatedBy: user?.uid,
      isActive: true,
    };
  });
}
