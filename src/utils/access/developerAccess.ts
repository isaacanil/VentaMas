import { canBaseAbility } from './baseAbility';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * CASL check usable outside React hooks (loaders, utilities).
 */
export const hasDeveloperAccess = (user: unknown): boolean => {
  if (typeof user === 'string') {
    return hasDeveloperAccess({ role: user });
  }
  if (!user || typeof user !== 'object') return false;

  const root = asRecord(user);
  const platformRoles = asRecord(root.platformRoles);
  if (platformRoles.dev === true) return true;

  return canBaseAbility(user, 'developerAccess', 'all');
};
