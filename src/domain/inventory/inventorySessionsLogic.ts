export type EmbeddedUser = {
  realName?: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
};

export const formatUserDisplay = (
  raw: string | number | null | undefined,
): string => {
  if (!raw) return '';
  const val = String(raw).trim();
  if (val.includes('@') || /\s/.test(val)) return val;
  if (val.length > 18) {
    return `${val.slice(0, 6)}...${val.slice(-4)}`;
  }
  return val;
};

export const pickEmbeddedUserName = (
  u: EmbeddedUser | null | undefined,
  fallbackUid?: string | null,
): string => {
  if (!u) return '';
  const candidates = [u.realName, u.name, u.displayName, u.fullName, u.email];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return fallbackUid || '';
};

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
};

export const resolveUserDisplayNameFromProfileDoc = (
  data: Record<string, unknown> | null,
  uid: string,
): string => {
  if (!data) return formatUserDisplay(uid);
  const nested = toRecord(data.user);
  const realName = String(
    (nested.realName as string | undefined) ||
      (data.realName as string | undefined) ||
      '',
  ).trim();
  const resolved =
    realName ||
    (nested.name as string | undefined) ||
    (nested.displayName as string | undefined) ||
    (data.displayName as string | undefined) ||
    (data.name as string | undefined) ||
    uid;
  return formatUserDisplay(resolved);
};

