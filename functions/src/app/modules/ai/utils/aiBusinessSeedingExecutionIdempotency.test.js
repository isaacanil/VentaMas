import { describe, expect, it } from 'vitest';

import {
  buildIdempotencyRequestHash,
} from '../../../core/utils/idempotencyRequestHash.util.js';
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

  it('matches the core idempotency hash output for legacy AI payloads', () => {
    const payload = {
      business: { name: 'Demo', address: 'A', optional: undefined },
      users: [{ name: 'owner', role: 'owner' }],
      flags: { draft: false, count: 2 },
    };

    expect(buildAiBusinessSeedingExecutionRequestHash(payload)).toBe(
      buildIdempotencyRequestHash(payload),
    );
    expect(buildAiBusinessSeedingExecutionRequestHash(payload)).toBe(
      'c48cea79cd26179da8a0895699b0fa542bc60ce13eaba9f189f5ecaf9287668d',
    );
  });
});
