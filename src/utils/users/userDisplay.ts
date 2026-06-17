import { toCleanString } from '@/utils/text';

export interface UserDisplayFields {
  id?: unknown;
  uid?: unknown;
  name?: unknown;
  realName?: unknown;
  displayName?: unknown;
  fullName?: unknown;
  username?: unknown;
  email?: unknown;
}

const firstNonEmpty = (...values: unknown[]): string | null => {
  for (const value of values) {
    const cleaned = toCleanString(value);
    if (cleaned) return cleaned;
  }

  return null;
};

const splitInitialParts = (value: string): string[] => {
  const localPart = value.includes('@') ? value.split('@')[0] : value;
  return localPart.split(/[\s._-]+/).filter(Boolean);
};

const firstCharacter = (value: string): string =>
  Array.from(value.trim())[0] ?? '';

export const resolveUserDisplayName = (
  user: UserDisplayFields | null | undefined,
  fallback = 'Usuario',
): string =>
  firstNonEmpty(
    user?.displayName,
    user?.realName,
    user?.name,
    user?.fullName,
    user?.username,
    user?.email,
    user?.uid,
    user?.id,
  ) ?? fallback;

export const resolveUserInitials = (
  userOrName: UserDisplayFields | string | null | undefined,
  fallback = 'U',
): string => {
  const source =
    typeof userOrName === 'string'
      ? toCleanString(userOrName)
      : resolveUserDisplayName(userOrName, '');

  if (!source) return fallback;

  const parts = splitInitialParts(source);
  const initials = (parts.length ? parts : [source])
    .slice(0, 2)
    .map(firstCharacter)
    .join('')
    .toUpperCase();

  return initials || fallback;
};
