// @ts-nocheck
import { DateTime } from 'luxon';
import { useMemo } from 'react';

export default function usePaymentDates(
  frequency = 'monthly',
  installments = 1,
  userStartDate = null,
) {
  const paymentDates = useMemo(() => {
    if (installments < 1 || installments > 36) {
      return [];
    }

    const baseDate = userStartDate
      ? DateTime.fromMillis(userStartDate).startOf('day')
      : DateTime.now().startOf('day');

    const dates = [];
    for (let i = 0; i < installments; i++) {
      let installmentDate;
      if (frequency === 'weekly') {
        installmentDate = baseDate.plus({ days: 7 * (i + 1) });
      } else if (frequency === 'annual') {
        installmentDate = baseDate.plus({ years: i + 1 });
      } else {
        installmentDate = baseDate.plus({ months: i + 1 });
      }
      dates.push(installmentDate.toMillis());
    }

    return dates;
  }, [frequency, installments, userStartDate]);

  const nextPaymentDate = useMemo(() => paymentDates[0] || null, [paymentDates]);

  return { paymentDates, nextPaymentDate };
}
