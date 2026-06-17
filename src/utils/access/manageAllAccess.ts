import { canBaseAbility } from './baseAbility';

/**
 * Access check for privileged users whose CASL rules include full management.
 * Today this maps to admin, owner and dev.
 */
export const hasManageAllAccess = (user: unknown): boolean => {
  return canBaseAbility(user, 'manage', 'all');
};

