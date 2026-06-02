export const toHrDateKey = (date: Date): string => {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
};

export const fromHrDateKey = (
  dateKey: string,
  boundary: 'start' | 'end',
): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (boundary === 'end') return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};
