import { describe, expect, it } from 'vitest';

import {
  isMissingNestedCreatedAt,
  normalizeBusinessMissingCreatedAt,
} from './businessMissingCreatedAtData';

describe('businessMissingCreatedAtData', () => {
  it('reports documents without nested business.createdAt', () => {
    const business = normalizeBusinessMissingCreatedAt('business-1', {
      createdAt: 'root-date',
      business: {
        name: 'Demo',
      },
    });

    expect(business).toMatchObject({
      id: 'business-1',
      name: 'Demo',
      createdAt: 'root-date',
      hasCreatedAtNested: false,
      hasCreatedAtRoot: true,
    });
    expect(isMissingNestedCreatedAt(business)).toBe(true);
  });

  it('uses nested createdAt as the effective value when present', () => {
    const business = normalizeBusinessMissingCreatedAt('business-2', {
      createdAt: 'root-date',
      business: {
        name: 'Demo',
        createdAt: 'nested-date',
      },
    });

    expect(business.createdAt).toBe('nested-date');
    expect(isMissingNestedCreatedAt(business)).toBe(false);
  });
});
