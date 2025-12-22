import { DateTime } from 'luxon';

export const calculateDueDate = (duePeriod, hasDueDate) => {
  if (!hasDueDate) return null;

  const currentDate = DateTime.local();
  return currentDate
    .plus({
      months: duePeriod?.months ?? 0,
      weeks: duePeriod?.weeks ?? 0,
      days: duePeriod?.days ?? 0,
    })
    .toMillis();
};
