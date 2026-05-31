import { describe, expect, it } from 'vitest';

import {
  claimOwnershipReducer,
  type ClaimOwnershipState,
} from './ClaimOwnershipModal.state';

const initialState: ClaimOwnershipState = {
  dismissed: false,
  submitting: false,
  claimUrl: null,
  claimCode: null,
  claimExpiresAt: null,
};

describe('ClaimOwnershipModal state', () => {
  it('marks the modal as dismissed', () => {
    expect(
      claimOwnershipReducer(initialState, {
        type: 'dismiss',
      }).dismissed,
    ).toBe(true);
  });

  it('stores generated claim data', () => {
    expect(
      claimOwnershipReducer(initialState, {
        type: 'setGeneratedClaim',
        claimUrl: 'https://app.test/claim-business?token=abc',
        claimCode: 'abc',
        claimExpiresAt: 123,
      }),
    ).toMatchObject({
      claimUrl: 'https://app.test/claim-business?token=abc',
      claimCode: 'abc',
      claimExpiresAt: 123,
    });
  });
});
