import { describe, expect, it } from 'vitest';

import { toMillis } from './toMillis';

describe('toMillis', () => {
  it('parses callable timestamp objects with underscored fields', () => {
    expect(
      toMillis({
        _seconds: 1772492281,
        _nanoseconds: 557000000,
      }),
    ).toBe(1772492281557);
  });

  it('parses timestamp objects with public fields', () => {
    expect(
      toMillis({
        seconds: 1772492281,
        nanoseconds: 557000000,
      }),
    ).toBe(1772492281557);
  });
});
