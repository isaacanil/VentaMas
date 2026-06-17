import type { MappedRecord, MappedValue } from './types';

export const isMappedRecord = (value: unknown): value is MappedRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const coerceMappedValue = (value: unknown): MappedValue => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (isMappedRecord(value)) return value;
  return String(value);
};

export function getNestedValue(
  obj: MappedRecord,
  path: string,
): MappedValue | undefined {
  return path
    .split('.')
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export const setNestedValue = (
  obj: MappedRecord,
  path: string,
  value: MappedValue,
) => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const existing = current[key];
    if (!isMappedRecord(existing)) {
      current[key] = {};
    }
    current = current[key] as MappedRecord;
  }

  current[keys[keys.length - 1]] = value;
};
