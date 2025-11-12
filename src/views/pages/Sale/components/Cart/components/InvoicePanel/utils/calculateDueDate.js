import dayjs from 'dayjs';

export const calculateDueDate = (duePeriod, hasDueDate) => {
  if (!hasDueDate) return null;

  const currentDate = dayjs();
  return currentDate
    .add(duePeriod?.months ?? 0, 'month')
    .add(duePeriod?.weeks ?? 0, 'week')
    .add(duePeriod?.days ?? 0, 'day')
    .valueOf();
};
