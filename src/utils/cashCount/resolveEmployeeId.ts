const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const fromPathLike = (value: unknown): string | null => {
  const path = toCleanString(value);
  if (!path) return null;
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  return toCleanString(segments[segments.length - 1]);
};

const fromSerializedReference = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const key = (value as Record<string, unknown>)._key;
  if (!key || typeof key !== 'object') return null;
  const path = (key as Record<string, unknown>).path;
  if (!path || typeof path !== 'object') return null;
  const segments = (path as Record<string, unknown>).segments;
  if (!Array.isArray(segments) || segments.length === 0) return null;
  const last = segments[segments.length - 1];
  return toCleanString(last);
};

export const resolveCashCountEmployeeId = (employee: unknown): string | null => {
  if (typeof employee === 'string') {
    return toCleanString(employee);
  }

  if (!employee || typeof employee !== 'object') {
    return null;
  }

  const record = employee as Record<string, unknown>;

  return (
    toCleanString(record.id) ||
    toCleanString(record.uid) ||
    fromPathLike(record.path) ||
    fromSerializedReference(record) ||
    null
  );
};
