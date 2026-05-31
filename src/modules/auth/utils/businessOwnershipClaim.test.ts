import { describe, expect, it } from 'vitest';

import {
  buildOwnershipClaimUrl,
  buildRedeemBusinessClaimSuccess,
} from './businessOwnershipClaim';

describe('businessOwnershipClaim', () => {
  it('uses backend claimUrl when available', () => {
    expect(
      buildOwnershipClaimUrl({
        baseUrl: 'https://app.test',
        payload: {
          claimUrl: 'https://claim.test/link',
          code: 'abc',
        },
      }),
    ).toBe('https://claim.test/link');
  });

  it('builds a claim URL from baseUrl and code', () => {
    expect(
      buildOwnershipClaimUrl({
        baseUrl: 'https://app.test',
        payload: {
          code: 'a b',
        },
      }),
    ).toBe('https://app.test/claim-business?token=a%20b');
  });

  it('keeps global dev role when caller or response is platform dev', () => {
    expect(
      buildRedeemBusinessClaimSuccess({
        isPlatformDeveloper: false,
        payload: {
          businessId: 'business-1',
          globalRole: 'dev',
          membershipRole: 'admin',
          message: 'Listo.',
        },
      }),
    ).toMatchObject({
      businessId: 'business-1',
      keepGlobalDevRole: true,
      membershipRole: 'admin',
      notificationMessage: 'Listo.',
      status: 'success',
    });
  });
});
