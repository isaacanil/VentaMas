import { PureAbility } from '@casl/ability';

import { defineAbilitiesFor } from '@/abilities';

/**
 * Permission to issue/generate ownership claim links for a business.
 * Separate from full ownership/billing administration.
 */
export const hasBusinessOwnershipClaimIssueAccess = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false;

  const rules = defineAbilitiesFor(user);
  const ability = new PureAbility(rules);

  return ability.can('businessOwnershipClaimIssue', 'all');
};

