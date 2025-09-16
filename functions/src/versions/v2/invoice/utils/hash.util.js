import { createHash } from 'node:crypto';

export function stableHash(obj) {
  try {
    const json = JSON.stringify(obj ?? {});
    return createHash('sha256').update(json).digest('hex');
  } catch (e) {
    // Fallback: timestamp + random to avoid crash
    return `${Date.now()}`;
  }
}

