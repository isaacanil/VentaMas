import { canBaseAbility } from './baseAbility';

/**
 * Permission to issue/generate ownership claim links for a business.
 * Separate from full ownership/billing administration.
 */
export const hasBusinessOwnershipClaimIssueAccess = (user: unknown): boolean => {
  return canBaseAbility(user, 'businessOwnershipClaimIssue', 'all');
};

