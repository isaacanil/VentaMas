type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const parsed = toCleanString(value);
    if (parsed) return parsed;
  }
  return null;
};

const resolveBoolean = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
};

export type NormalizedFirestoreUser = UnknownRecord & {
  id: string;
  uid: string;
  name?: string;
  username?: string;
  displayName?: string;
  realName?: string;
  email?: string;
  role?: string;
  activeRole?: string;
  businessID?: string;
  businessId?: string;
  activeBusinessId?: string;
  active?: boolean;
};

/**
 * Normaliza un documento de `users/{uid}` para que el frontend NO dependa del
 * espejo legacy `user.*`.
 *
 * - Mantiene el payload original pero promueve alias a la raíz.
 * - Alinea `id`/`uid`, `businessID`/`businessId`/`activeBusinessId`, `role`/`activeRole`.
 */
export const normalizeFirestoreUser = (
  docId: string,
  raw: unknown,
): NormalizedFirestoreUser => {
  const root = asRecord(raw);
  const businessNode = asRecord(root.business);

  const uid = resolveString(
    root.uid,
    root.id,
    root.userId,
    root.user_id,
    docId,
  )!;

  const canonicalBusinessId = resolveString(
    root.activeBusinessId,
    root.activeBusinessID,
    root.businessID,
    root.businessId,
    businessNode.activeBusinessId,
    businessNode.id,
    businessNode.businessID,
    businessNode.businessId,
  );

  const canonicalRole = resolveString(root.activeRole, root.role);

  const active = resolveBoolean(root.active);

  const name = resolveString(root.name);
  const displayName = resolveString(root.displayName);
  const realName = resolveString(root.realName);
  const email = resolveString(root.email);

  const next: NormalizedFirestoreUser = {
    ...(root as UnknownRecord),
    id: uid,
    uid,
  };

  if (name) next.name = name;
  // Legacy alias for UI/session consumers; canonical field in Firestore is `name`.
  if (name) next.username = name;
  if (displayName) next.displayName = displayName;
  if (realName) next.realName = realName;
  if (email) next.email = email;
  if (canonicalRole) {
    next.activeRole = canonicalRole;
    next.role = canonicalRole;
  }
  if (typeof active === 'boolean') next.active = active;
  if (canonicalBusinessId) {
    next.activeBusinessId = canonicalBusinessId;
    next.businessID = canonicalBusinessId;
    next.businessId = canonicalBusinessId;
  }

  return next;
};
