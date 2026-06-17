import {
  buildIdempotencyRequestHash,
} from '../../../core/utils/idempotencyRequestHash.util.js';

export const normalizeAiBusinessSeedingExecuteRequestId = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
};

export const buildAiBusinessSeedingExecutionRequestHash = (value) =>
  buildIdempotencyRequestHash(value);
