import { describe, expect, it } from 'vitest';

import { normalizeMatch } from './normalizeMatch';

describe('normalizeMatch', () => {
  it('normalizes a string route as an exact path pattern', () => {
    expect(normalizeMatch('/sales')).toEqual({
      path: '/sales',
      end: true,
    });
  });

  it('defaults a PathPattern to an exact match', () => {
    expect(
      normalizeMatch({
        path: '/sales/:invoiceId',
        caseSensitive: true,
      }),
    ).toEqual({
      path: '/sales/:invoiceId',
      caseSensitive: true,
      end: true,
    });
  });

  it('preserves a PathPattern configured with end false', () => {
    expect(
      normalizeMatch({
        path: '/accounting',
        end: false,
      }),
    ).toEqual({
      path: '/accounting',
      end: false,
    });
  });
});
