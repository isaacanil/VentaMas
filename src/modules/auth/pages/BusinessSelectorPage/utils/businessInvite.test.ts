import { describe, expect, it } from 'vitest';

import {
  isAlreadyMemberInviteResponse,
  normalizeRedeemedBusinessInvite,
} from './businessInvite';

describe('businessInvite', () => {
  it('normalizes clean invite response values', () => {
    expect(
      normalizeRedeemedBusinessInvite({
        businessId: ' business-1 ',
        businessName: ' Demo ',
        role: ' admin ',
      }),
    ).toEqual({
      businessId: 'business-1',
      businessName: 'Demo',
      role: 'admin',
    });
  });

  it('uses a cashier role when response role is missing', () => {
    expect(normalizeRedeemedBusinessInvite({}).role).toBe('cashier');
  });

  it('identifies already-member responses', () => {
    expect(
      isAlreadyMemberInviteResponse({
        ok: false,
        reason: 'already-member',
      }),
    ).toBe(true);
  });
});
