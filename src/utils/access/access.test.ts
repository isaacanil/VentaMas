import { describe, expect, it } from 'vitest';

import {
  hasBillingAccountManageAccess,
  hasBusinessCreateUnderAccountQuotaAccess,
  isBusinessAccountOwner,
} from './accountLevelCapabilities';
import {
  hasAuthorizationApproveAccess,
  hasAuthorizationPinSelfGenerateAccess,
  hasAuthorizationPinUsersManageAccess,
  hasAuthorizationRequestsViewAccess,
} from './authorizationAccess';
import { hasBusinessOwnershipClaimIssueAccess } from './businessOwnershipClaimIssueAccess';
import { hasBusinessSettingsManageAccess } from './businessSettingsAccess';
import { hasDeveloperAccess } from './developerAccess';
import { requiresInvoiceDiscountPinAuthorization } from './invoiceDiscountAccess';
import { hasManageAllAccess } from './manageAllAccess';
import { hasRequiredCapabilitiesAccess } from './routeCapabilities';

const user = (role: string, extra: Record<string, unknown> = {}) => ({
  uid: `${role}-uid`,
  role,
  ...extra,
});

describe('access helpers', () => {
  it('normalizes developer access from roles and platform flags', () => {
    expect(hasDeveloperAccess('dev')).toBe(true);
    expect(hasDeveloperAccess(user('dev'))).toBe(true);
    expect(hasDeveloperAccess({ platformRoles: { dev: true } })).toBe(true);

    expect(hasDeveloperAccess(user('admin'))).toBe(false);
    expect(hasDeveloperAccess(user('owner'))).toBe(false);
    expect(hasDeveloperAccess(null)).toBe(false);
  });

  it('maps privileged manage-all access through the base ability rules', () => {
    expect(hasManageAllAccess(user('admin'))).toBe(true);
    expect(hasManageAllAccess(user('owner'))).toBe(true);
    expect(hasManageAllAccess(user('dev'))).toBe(true);

    expect(hasManageAllAccess(user('manager'))).toBe(false);
    expect(hasManageAllAccess('admin')).toBe(false);
    expect(hasManageAllAccess(null)).toBe(false);
  });

  it('keeps invoice discount PIN requirements scoped to cashier roles', () => {
    expect(requiresInvoiceDiscountPinAuthorization(user('cashier'))).toBe(true);
    expect(requiresInvoiceDiscountPinAuthorization(user('specialCashier1'))).toBe(
      true,
    );

    expect(requiresInvoiceDiscountPinAuthorization(user('manager'))).toBe(false);
    expect(requiresInvoiceDiscountPinAuthorization(user('admin'))).toBe(false);
    expect(requiresInvoiceDiscountPinAuthorization(user('dev'))).toBe(false);
  });

  it('centralizes authorization and ownership-claim capability checks', () => {
    expect(hasAuthorizationApproveAccess(user('manager'))).toBe(true);
    expect(hasAuthorizationApproveAccess(user('cashier'))).toBe(false);

    for (const role of ['admin', 'owner', 'dev']) {
      expect(hasAuthorizationRequestsViewAccess(user(role))).toBe(true);
      expect(hasAuthorizationPinSelfGenerateAccess(user(role))).toBe(true);
      expect(hasAuthorizationPinUsersManageAccess(user(role))).toBe(true);
      expect(hasBusinessOwnershipClaimIssueAccess(user(role))).toBe(true);
    }
  });

  it('keeps business settings access narrower than manage-all access', () => {
    expect(hasBusinessSettingsManageAccess(user('admin'))).toBe(true);
    expect(hasBusinessSettingsManageAccess(user('owner'))).toBe(true);
    expect(hasBusinessSettingsManageAccess(user('dev'))).toBe(true);
    expect(hasBusinessSettingsManageAccess(user('manager'))).toBe(true);

    expect(hasBusinessSettingsManageAccess(user('cashier'))).toBe(false);
    expect(hasBusinessSettingsManageAccess(null)).toBe(false);
  });

  it('resolves account ownership from direct, nested and active-role signals', () => {
    expect(
      isBusinessAccountOwner({ uid: 'u-1' }, { ownerUid: 'u-1' }),
    ).toBe(true);
    expect(
      isBusinessAccountOwner(
        { id: 'u-2' },
        { business: { business: { ownerUid: 'u-2' } } },
      ),
    ).toBe(true);
    expect(isBusinessAccountOwner({ activeBusinessRole: 'owner' }, {})).toBe(
      true,
    );

    expect(isBusinessAccountOwner({ uid: 'u-1' }, { ownerUid: 'u-2' })).toBe(
      false,
    );
  });

  it('allows billing and quota actions through explicit capabilities or ownership', () => {
    expect(
      hasBillingAccountManageAccess({
        user: user('dev'),
        business: { ownerUid: 'someone-else' },
      }),
    ).toBe(true);
    expect(
      hasBillingAccountManageAccess({
        user: { uid: 'owner-uid', role: 'cashier' },
        business: { ownerUid: 'owner-uid' },
      }),
    ).toBe(true);
    expect(
      hasBillingAccountManageAccess({
        user: user('admin'),
        business: { ownerUid: 'someone-else' },
      }),
    ).toBe(false);

    expect(
      hasBusinessCreateUnderAccountQuotaAccess({
        user: user('cashier'),
        hasBusinesses: false,
        hasOwnedBusinessLink: false,
      }),
    ).toBe(true);
    expect(
      hasBusinessCreateUnderAccountQuotaAccess({
        user: user('cashier'),
        hasBusinesses: true,
        hasOwnedBusinessLink: true,
      }),
    ).toBe(true);
    expect(
      hasBusinessCreateUnderAccountQuotaAccess({
        user: user('dev'),
        hasBusinesses: true,
        hasOwnedBusinessLink: false,
      }),
    ).toBe(true);
    expect(
      hasBusinessCreateUnderAccountQuotaAccess({
        user: user('admin'),
        hasBusinesses: true,
        hasOwnedBusinessLink: false,
      }),
    ).toBe(false);
  });

  it('supports any/all route capability checks with empty-capability bypass', () => {
    expect(
      hasRequiredCapabilitiesAccess({
        user: null,
        requiredCapabilities: [],
      }),
    ).toBe(true);
    expect(
      hasRequiredCapabilitiesAccess({
        user: user('admin'),
        requiredCapabilities: ['businessOwnershipClaimIssue', 'developerAccess'],
      }),
    ).toBe(true);
    expect(
      hasRequiredCapabilitiesAccess({
        user: user('admin'),
        requiredCapabilities: ['businessOwnershipClaimIssue', 'developerAccess'],
        mode: 'all',
      }),
    ).toBe(false);
    expect(
      hasRequiredCapabilitiesAccess({
        user: user('dev'),
        requiredCapabilities: ['businessOwnershipClaimIssue', 'developerAccess'],
        mode: 'all',
      }),
    ).toBe(true);
  });
});
