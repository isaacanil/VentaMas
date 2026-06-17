export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const asRecord = (value: unknown): UnknownRecord =>
  isRecord(value) ? value : {};
