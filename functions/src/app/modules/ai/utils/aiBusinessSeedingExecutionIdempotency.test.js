import { describe, expect, it } from 'vitest';

import {
  buildAiBusinessSeedingExecutionRequestHash,
  normalizeAiBusinessSeedingExecuteRequestId,
} from './aiBusinessSeedingExecutionIdempotency.js';

describe('aiBusinessSeedingExecutionIdempotency helpers', () => {
  it('normalizes execute request ids for Firestore document ids', () => {
    expect(
      normalizeAiBusinessSeedingExecuteRequestId('  abc 123/@!.xyz  '),
    ).toBe('abc-123-.xyz');
  });

  it('limits execute request ids to 120 characters', () => {
    expect(
      normalizeAiBusinessSeedingExecuteRequestId('a'.repeat(140)),
    ).toHaveLength(120);
  });

  it('builds the same request hash regardless of object key order', () => {
    const first = buildAiBusinessSeedingExecutionRequestHash({
      business: { name: 'Demo', address: 'A' },
      users: [{ name: 'owner', role: 'owner' }],
    });
    const second = buildAiBusinessSeedingExecutionRequestHash({
      users: [{ role: 'owner', name: 'owner' }],
      business: { address: 'A', name: 'Demo' },
    });

    expect(second).toBe(first);
  });

  it('changes the request hash when payload content changes', () => {
    const first = buildAiBusinessSeedingExecutionRequestHash({
      business: { name: 'Demo A' },
    });
    const second = buildAiBusinessSeedingExecutionRequestHash({
      business: { name: 'Demo B' },
    });

    expect(second).not.toBe(first);
  });
});
