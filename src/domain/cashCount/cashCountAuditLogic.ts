export const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Ocurrio un error inesperado.';
};

export const resolveBusinessName = (docId: string, value: unknown): string => {
  const data = toRecord(value);
  const businessData = toRecord(data.business);
  return (
    (businessData.name as string | undefined) ||
    (data.name as string | undefined) ||
    (data.businessName as string | undefined) ||
    docId
  );
};

export const resolveCashierId = (cashCount: unknown): string | null => {
  const cc = toRecord(cashCount);
  const opening = toRecord(cc.opening);
  const employee = toRecord(opening.employee);
  const key = toRecord(employee._key);
  const path = toRecord(key.path);
  const segments = path.segments;

  const fromSegments =
    Array.isArray(segments) && segments.length > 0
      ? String(segments[segments.length - 1] ?? '').trim()
      : '';

  const candidate =
    (employee.id as string | undefined) ||
    (employee.uid as string | undefined) ||
    (fromSegments || undefined);

  return candidate ? String(candidate) : null;
};

