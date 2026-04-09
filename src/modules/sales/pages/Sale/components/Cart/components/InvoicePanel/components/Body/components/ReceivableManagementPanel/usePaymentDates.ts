import { useMemo } from 'react';

import { calculatePaymentDates } from './receivableUtils';

type PaymentFrequency = 'monthly' | 'weekly' | 'annual' | string;

export default function usePaymentDates(
  frequency: PaymentFrequency = 'monthly',
  installments = 1,
  userStartDate: number | null = null,
  includeStartDate = false,
) {
  const { paymentDates, nextPaymentDate } = useMemo(() => {
    if (installments < 1 || installments > 36) {
      return { paymentDates: [], nextPaymentDate: null };
    }

    return calculatePaymentDates(
      frequency,
      installments,
      userStartDate,
      { includeStartDate },
    );
  }, [frequency, installments, userStartDate, includeStartDate]);

  return { paymentDates, nextPaymentDate };
}
