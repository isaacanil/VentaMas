import { describe, expect, it } from 'vitest';

import {
  buildIdempotencyRequestHash,
  stableSerialize,
} from './idempotencyRequestHash.util.js';

describe('idempotencyRequestHash.util', () => {
  it('serializes objects with stable sorted keys recursively', () => {
    const payload = {
      businessId: 'biz-1',
      amount: 125.5,
      nested: { z: 2, a: 1 },
      methods: [
        { value: 25, method: 'cash' },
        { method: 'transfer', value: 100.5 },
      ],
    };

    expect(stableSerialize(payload)).toBe(
      '{"amount":125.5,"businessId":"biz-1","methods":[{"method":"cash","value":25},{"method":"transfer","value":100.5}],"nested":{"a":1,"z":2}}',
    );
  });

  it('builds the same hash for equivalent payloads regardless of key order', () => {
    const firstPayload = {
      businessId: 'biz-1',
      amount: 125.5,
      nested: { z: 2, a: 1 },
      methods: [
        { value: 25, method: 'cash' },
        { method: 'transfer', value: 100.5 },
      ],
    };
    const reorderedPayload = {
      methods: [
        { method: 'cash', value: 25 },
        { value: 100.5, method: 'transfer' },
      ],
      nested: { a: 1, z: 2 },
      amount: 125.5,
      businessId: 'biz-1',
    };

    expect(buildIdempotencyRequestHash(firstPayload)).toBe(
      'c29f6305d023be06686f9b83cf91421865132bf7ec7fcaa15d7d0dde58f397b2',
    );
    expect(buildIdempotencyRequestHash(reorderedPayload)).toBe(
      buildIdempotencyRequestHash(firstPayload),
    );
  });

  it('changes the hash when the payload value changes', () => {
    const payload = {
      businessId: 'biz-1',
      amount: 125.5,
      nested: { a: 1, z: 2 },
      methods: [
        { method: 'cash', value: 25 },
        { method: 'transfer', value: 100.5 },
      ],
    };

    expect(buildIdempotencyRequestHash({ ...payload, amount: 125.51 })).toBe(
      'be1270fcaefbad62002de474c73ec4aba097ac08408144bd725df532d3537ec4',
    );
  });

  it('preserves legacy undefined serialization inside object values', () => {
    expect(stableSerialize({ present: undefined, missing: null })).toBe(
      '{"missing":null,"present":undefined}',
    );
  });
});
