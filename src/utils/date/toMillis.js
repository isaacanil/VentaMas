export const toMillis = (d) => {
  if (d === null || d === undefined) return undefined; // 👈
  if (typeof d === 'number') return d;

  if (typeof d === 'string') {
    const int = parseInt(d.split('.')[0], 10);
    return Number.isNaN(int) ? new Date(d).getTime() : int;
  }

  if (typeof d?.toMillis === 'function') return d.toMillis(); // Luxon / Firebase Timestamp
  if (typeof d?.valueOf === 'function') return d.valueOf(); // Dayjs / native Date
  if (typeof d?.seconds === 'number') return d.seconds * 1000;

  return new Date(d).getTime();
};
