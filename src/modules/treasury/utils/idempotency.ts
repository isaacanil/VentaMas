const normalizeString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeNumber = (value: unknown): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0';
  return parsed.toFixed(2);
};

export const buildTreasuryIdempotencyKey = (
  command: string,
  parts: Array<unknown>,
): string =>
  [
    'treasury',
    normalizeString(command) || 'unknown-command',
    ...parts.map((part) =>
      typeof part === 'number' ? normalizeNumber(part) : normalizeString(part),
    ),
  ].join(':');
