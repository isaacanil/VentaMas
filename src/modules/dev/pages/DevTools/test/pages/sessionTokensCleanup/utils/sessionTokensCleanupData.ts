import type { SessionTokenDoc, TokenResultItem } from '../types';

const UNKNOWN_USER_ID = 'desconocido';

export const hasOnlyUserId = (data: SessionTokenDoc | null | undefined) => {
  if (!data || typeof data !== 'object') return false;

  const presentKeys = Object.keys(data).filter(
    (key) => data[key] !== undefined,
  );

  if (!presentKeys.length) return false;
  return presentKeys.every((key) => key === 'userId');
};

export const toIncompleteSessionTokenResult = (
  id: string,
  data: SessionTokenDoc,
): TokenResultItem | null => {
  if (!hasOnlyUserId(data)) return null;

  return {
    id,
    userId: data.userId ?? UNKNOWN_USER_ID,
    keys: Object.keys(data),
  };
};
