import { DateTime, type DurationLikeObject } from 'luxon';
import type { AccountsReceivablePaymentFrequency } from '@/utils/accountsReceivable/types';

type StartDateInput = DateTime | number | null;

interface PaymentDatesResult {
  paymentDates: number[];
  nextPaymentDate: number | null;
}

interface PaymentDateOptions {
  includeStartDate?: boolean;
}

const MAX_INSTALLMENTS = 3000;

const getStartDate = (customStartDate: StartDateInput): DateTime => {
  if (customStartDate) {
    return typeof customStartDate === 'number'
      ? DateTime.fromMillis(customStartDate).startOf('day')
      : customStartDate.startOf('day');
  }

  return DateTime.now().startOf('day');
};

const getPaymentInterval = (
  frequency: AccountsReceivablePaymentFrequency,
): DurationLikeObject => {
  switch (frequency) {
    case 'monthly':
      return { months: 1 };
    case 'weekly':
      return { weeks: 1 };
    case 'biweekly':
      return { weeks: 2 };
    case 'annual':
      return { years: 1 };
    case 'quarterly':
      return { months: 3 };
    case 'daily':
      return { days: 1 };
    default:
      return { days: 0 };
  }
};

export const calculatePaymentDates = (
  frequency: AccountsReceivablePaymentFrequency,
  installments: number,
  customStartDate: StartDateInput = null,
  options: PaymentDateOptions = {},
): PaymentDatesResult => {
  const { includeStartDate = false } = options;
  const startDate = getStartDate(customStartDate);

  if (installments >= MAX_INSTALLMENTS) {
    return {
      paymentDates: [],
      nextPaymentDate: null,
    };
  }

  const interval = getPaymentInterval(frequency);
  const intervalKey = Object.keys(interval)[0] as keyof DurationLikeObject;
  const paymentDates: number[] = [];

  for (let i = 0; i < installments; i++) {
    const step = includeStartDate ? i : i + 1;
    paymentDates.push(
      startDate
        .plus({ ...interval, [intervalKey]: step } as DurationLikeObject)
        .toMillis(),
    );
  }

  const today = DateTime.now().startOf('day').toMillis();
  const nextPaymentDate = paymentDates.find((date) => date >= today) ?? null;

  return {
    paymentDates,
    nextPaymentDate,
  };
};

export const formatPaymentDate = (
  timestamp: number,
  format = 'dd/MM/yyyy',
): string => {
  if (!timestamp) return '';
  return DateTime.fromMillis(timestamp).toFormat(format);
};

export const getFormattedDates = (
  dates: number[],
  format = 'dd/MM/yyyy',
): string[] => {
  if (!dates || !Array.isArray(dates)) return [];
  return dates.map((date) => formatPaymentDate(date, format));
};
