import { DateTime } from 'luxon';

type DuePeriod = {
  months?: number;
  weeks?: number;
  days?: number;
};


export const calculateDueDate = (duePeriod: DuePeriod | null | undefined, hasDueDate: boolean) => {
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
