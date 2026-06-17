import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import type { UserIdentity } from '@/types/users';
import { calculatePaymentDates } from '@/domain/accountsReceivable/paymentDates';
import type {
  AccountsReceivableDoc,
  AccountsReceivableInstallment,
} from '@/utils/accountsReceivable/types';

const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100;
};

const toFiniteNumber = (value: unknown): number | null => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numericValue) ? numericValue : null;
};

interface GenerateInstallmentsParams {
  ar: AccountsReceivableDoc;
  user?: UserIdentity | null;
}

export function generateInstallments({
  ar,
  user,
}: GenerateInstallmentsParams): AccountsReceivableInstallment[] {
  const parsedTotalInstallments = toFiniteNumber(ar.totalInstallments);
  const totalReceivable = toFiniteNumber(ar.totalReceivable);

  if (
    !Number.isInteger(parsedTotalInstallments) ||
    parsedTotalInstallments <= 0 ||
    totalReceivable === null
  ) {
    return [];
  }

  const totalInstallments = parsedTotalInstallments;

  // Generación de fechas de pago utilizando calculatePaymentDates
  const { paymentDates } = calculatePaymentDates(
    ar.paymentFrequency ?? 'monthly',
    totalInstallments,
    typeof ar.paymentDate === 'number' ? ar.paymentDate : null,
    { includeStartDate: true },
  );

  // Cálculo del monto de cada cuota
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
      installmentNumber: index + 1, // Añadiendo el número de cuota
      installmentBalance: installmentAmount,
      createdBy: user?.uid,
      updatedBy: user?.uid,
      isActive: true,
    });
  });

  return installments;
}
