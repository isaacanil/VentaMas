import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { calculatePaymentDates } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/receivableUtils';
import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDoc,
  AccountsReceivableInstallment,
} from '@/utils/accountsReceivable/types';

const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100;
};

interface GenerateInstallmentsParams {
  ar: AccountsReceivableDoc;
  user?: UserIdentity | null;
}

export function generateInstallments({
  ar,
  user,
}: GenerateInstallmentsParams): AccountsReceivableInstallment[] {
  const totalInstallments = ar.totalInstallments ?? 0;
  const totalReceivable = ar.totalReceivable ?? 0;

  if (!totalInstallments || totalInstallments <= 0) {
    return [];
  }

  // Generaci?n de fechas de pago utilizando calculatePaymentDates
  const { paymentDates } = calculatePaymentDates(
    ar.paymentFrequency ?? 'monthly',
    totalInstallments,
  );

  // C?lculo del monto de cada cuota
  const precisePart = totalReceivable / totalInstallments;
  const roundedPart = roundToTwo(precisePart);
  const roundedTotal = roundToTwo(roundedPart * totalInstallments);

  const difference = roundToTwo(totalReceivable - roundedTotal);
  const installments: AccountsReceivableInstallment[] = [];

  paymentDates.forEach((date, index) => {
    let installmentAmount = roundedPart;
    if (index === totalInstallments - 1) {
      installmentAmount = roundToTwo(roundedPart + difference);
    }

    const now = DateTime.now().toMillis();

    installments.push({
      id: nanoid(),
      arId: ar.id,
      createdAt: now,
      updatedAt: now,
      installmentDate: date,
      installmentAmount,
      installmentNumber: index + 1, // A?adiendo el n?mero de cuota
      installmentBalance: installmentAmount,
      createdBy: user?.uid,
      updatedBy: user?.uid,
      isActive: true,
    });
  });

  return installments;
}
