import dayjs from 'dayjs';

export const parseTimestamp = (value) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  if (typeof value === 'number') return dayjs(value);
  if (value.seconds) return dayjs.unix(value.seconds);
  if (value._seconds) return dayjs.unix(value._seconds);
  if (typeof value === 'string') return dayjs(value);
  if (value.toDate instanceof Function) return dayjs(value.toDate());
  return null;
};

export const formatDateTime = (value, fallback = '—') => {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.format('DD/MM/YYYY HH:mm:ss') : fallback;
};
