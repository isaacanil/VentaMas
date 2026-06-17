import { describe, expect, it } from 'vitest';

import { resolveBusinessMetadataFromSnapshot } from './businessMetadata';

describe('businessMetadata', () => {
  it('resolves metadata from root fields first', () => {
    expect(
      resolveBusinessMetadataFromSnapshot({
        name: ' Root Business ',
        ownerUid: 'owner-root',
        subscription: {
          status: 'ACTIVE',
          planId: 'plan-root',
        },
        business: {
          name: 'Nested Business',
          ownerUid: 'owner-nested',
        },
      }),
    ).toEqual({
      name: 'Root Business',
      ownerUid: 'owner-root',
      subscriptionStatus: 'active',
      subscriptionPlanId: 'plan-root',
    });
  });

  it('falls back to nested business and subscription fields', () => {
    expect(
      resolveBusinessMetadataFromSnapshot({
        business: {
          business: {
            name: 'Deep Business',
            ownerUid: 'owner-deep',
          },
          subscription: {
            status: 'TRIALING',
            planId: 'plan-nested',
          },
        },
      }),
    ).toEqual({
      name: 'Deep Business',
      ownerUid: 'owner-deep',
      subscriptionStatus: 'trialing',
      subscriptionPlanId: 'plan-nested',
    });
  });

  it('returns null values when metadata is missing', () => {
    expect(resolveBusinessMetadataFromSnapshot(null)).toEqual({
      name: null,
      ownerUid: null,
      subscriptionStatus: null,
      subscriptionPlanId: null,
    });
  });

  it('ignores array nodes when resolving nested metadata', () => {
    expect(
      resolveBusinessMetadataFromSnapshot({
        business: [],
        subscription: [],
      }),
    ).toEqual({
      name: null,
      ownerUid: null,
      subscriptionStatus: null,
      subscriptionPlanId: null,
    });
  });
});
