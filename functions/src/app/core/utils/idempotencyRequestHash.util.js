import { createHash } from 'node:crypto';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const stableSerialize = (value) => {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const record = asRecord(value);
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(',')}}`;
};

export const buildIdempotencyRequestHash = (value) =>
  createHash('sha256').update(stableSerialize(value)).digest('hex');
