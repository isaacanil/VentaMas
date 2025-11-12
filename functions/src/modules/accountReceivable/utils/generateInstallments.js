import { nanoid } from 'nanoid';

import { FieldValue, Timestamp } from '../../../core/config/firebase.js';

import { calculatePaymentDates } from './calculatePaymentDates.js';

const round2 = (n) => Math.round(n * 100) / 100;

export function generateInstallments({ ar, user }) {
  const { totalInstallments, totalReceivable, paymentFrequency } = ar;
  const { paymentDates } = calculatePaymentDates(
    paymentFrequency,
    totalInstallments,
  );

  const part = round2(totalReceivable / totalInstallments);
  const diff = round2(totalReceivable - part * totalInstallments);
  const tsNow = FieldValue.serverTimestamp();

  return paymentDates.map((msDate, i) => {
    const amount = i === totalInstallments - 1 ? round2(part + diff) : part;
    return {
      id: nanoid(),
      arId: ar.id,
      installmentNumber: i + 1,
      installmentAmount: amount,
      installmentBalance: amount,
      installmentDate: Timestamp.fromMillis(msDate),
      createdAt: tsNow,
      updatedAt: tsNow,
      createdBy: user.uid,
      updatedBy: user.uid,
      isActive: true,
    };
  });
}
