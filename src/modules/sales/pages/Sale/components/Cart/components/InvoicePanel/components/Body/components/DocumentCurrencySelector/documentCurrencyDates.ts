const asTimestampRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const resolveTimestampMillis = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : null;
  }

  const record = asTimestampRecord(value);
  const toMillis = record.toMillis;
  if (typeof toMillis === 'function') {
    const millis = Number(toMillis.call(value));
    return Number.isFinite(millis) ? millis : null;
  }

  const toDate = record.toDate;
  if (typeof toDate === 'function') {
    const date = toDate.call(value);
    if (date instanceof Date) {
      const millis = date.getTime();
      return Number.isFinite(millis) ? millis : null;
    }
  }

  const seconds = Number(record.seconds ?? record._seconds);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
};
