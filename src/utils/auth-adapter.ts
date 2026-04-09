import type {
  Membership,
  MembershipRole,
  MembershipStatus,
  User,
  UserAccessControl,
} from '@/types/models';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

type UnknownRecord = Record<string, unknown>;

const UNKNOWN_ROLE = 'unknown' as MembershipRole;

export type UserContextSource = 'legacy' | 'hybrid' | 'new';

export interface NormalizeCurrentUserOptions {
  preferredBusinessId?: string | null;
}

export interface AvailableBusinessContext {
  businessId: string;
  name: string;
  role: MembershipRole;
  status: MembershipStatus;
  isActive: boolean;
}

export interface CurrentUserContext {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  role: MembershipRole | null;
  activeRole: MembershipRole | null;
  businessID: string | null;
  businessId: string | null;
  activeBusinessId: string | null;
  defaultBusinessId: string | null;
  lastSelectedBusinessId: string | null;
  availableBusinesses: AvailableBusinessContext[];
  accessControl: UserAccessControl[];
  memberships: Membership[];
  hasMultipleBusinesses: boolean;
  isLegacyUser: boolean;
  source: UserContextSource;
  rawUser: User | null;
}

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord =>
  isRecord(value) ? value : {};

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

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  return undefined;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const parsed = value
    .map((item) => toCleanString(item))
    .filter((item): item is string => Boolean(item));
  return parsed.length ? parsed : undefined;
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const resolveBusinessIdFromNode = (node: UnknownRecord): string | null => {
  const business = asRecord(node.business);
  return resolveString(
    node.businessId,
    node.businessID,
    business.id,
    business.businessId,
    business.businessID,
  );
};

const resolveStatusFromNode = (node: UnknownRecord): MembershipStatus => {
  const explicitStatus = resolveString(node.status);
  if (explicitStatus) {
    return explicitStatus as MembershipStatus;
  }
  if (typeof node.active === 'boolean') {
    return node.active ? 'active' : 'inactive';
  }
  return 'active';
};

const normalizeAccessControlList = (
  items: unknown[],
  fallbackRole: MembershipRole | null,
): UserAccessControl[] => {
  const normalized: UserAccessControl[] = [];

  for (const rawItem of items) {
    const item = asRecord(rawItem);
    const businessId = resolveBusinessIdFromNode(item);
    if (!businessId) continue;

    const role =
      (normalizeRoleId(resolveString(item.role)) as MembershipRole | null) ??
      fallbackRole ??
      UNKNOWN_ROLE;

    normalized.push({
      businessId,
      businessName: resolveString(
        item.businessName,
        item.name,
        asRecord(item.business).name,
        asRecord(asRecord(item.business).business).name,
      ),
      role,
      status: resolveStatusFromNode(item),
      permissions: toStringArray(item.permissions),
      isOwner: toBoolean(item.isOwner),
      isPrimary: toBoolean(item.isPrimary),
      createdAt: (item.createdAt as UserAccessControl['createdAt']) ?? undefined,
      updatedAt: (item.updatedAt as UserAccessControl['updatedAt']) ?? undefined,
    });
  }

  return normalized;
};

const mergeAccessControl = (
  current: UserAccessControl,
  incoming: UserAccessControl,
): UserAccessControl => {
  const mergedRole =
    current.role !== UNKNOWN_ROLE ? current.role : incoming.role;

  return {
    ...current,
    role: mergedRole || incoming.role || UNKNOWN_ROLE,
    businessName: current.businessName || incoming.businessName || null,
    status: current.status || incoming.status || 'active',
    permissions:
      current.permissions && current.permissions.length
        ? current.permissions
        : incoming.permissions,
    isOwner: current.isOwner ?? incoming.isOwner,
    isPrimary: current.isPrimary ?? incoming.isPrimary,
    createdAt: current.createdAt ?? incoming.createdAt,
    updatedAt: current.updatedAt ?? incoming.updatedAt,
  };
};

const dedupeAccessControl = (items: UserAccessControl[]): UserAccessControl[] => {
  const byBusinessId = new Map<string, UserAccessControl>();

  for (const item of items) {
    const existing = byBusinessId.get(item.businessId);
    if (!existing) {
      byBusinessId.set(item.businessId, item);
      continue;
    }
    byBusinessId.set(item.businessId, mergeAccessControl(existing, item));
  }

  return Array.from(byBusinessId.values());
};

const resolveActiveBusinessId = (
  preferredBusinessId: string | null,
  accessControl: UserAccessControl[],
): string | null => {
  if (preferredBusinessId) {
    if (!accessControl.length) return preferredBusinessId;
    const hasAccess = accessControl.some(
      (entry) => entry.businessId === preferredBusinessId,
    );
    if (hasAccess) return preferredBusinessId;
  }

  return accessControl[0]?.businessId ?? null;
};

const buildAvailableBusinesses = (
  accessControl: UserAccessControl[],
): AvailableBusinessContext[] =>
  accessControl.map((entry) => {
    const status = entry.status || 'active';
    const isActive = !['inactive', 'suspended', 'revoked'].includes(
      String(status).toLowerCase(),
    );

    return {
      businessId: entry.businessId,
      name: entry.businessName || `Negocio ${entry.businessId}`,
      role: entry.role,
      status,
      isActive,
    };
  });

export const normalizeCurrentUserContext = (
  user: User | null | undefined | unknown,
  options: NormalizeCurrentUserOptions = {},
): CurrentUserContext => {
  const root = asRecord(user);

  const uid = resolveString(
    root.uid,
    root.id,
    root.userId,
    root.user_id,
  );

  const email = resolveString(root.email);
  const displayName = resolveString(
    root.displayName,
    root.realName,
    root.name,
  );

  const rootPlatformRoles = asRecord(root.platformRoles);
  const isPlatformDev = rootPlatformRoles.dev === true;

  const globalRole = (isPlatformDev
    ? 'dev'
    : normalizeRoleId(resolveString(root.activeRole, root.role))) as MembershipRole | null;

  const aliasBusinessId = resolveString(
    root.activeBusinessId,
    root.businessID,
    root.businessId,
    resolveBusinessIdFromNode(root),
  );

  const rootAccessControl = toArray(root.accessControl);
  const membershipsFallback = rootAccessControl.length
    ? []
    : toArray(root.memberships);

  const persistedAccessControl = normalizeAccessControlList(
    [
      ...rootAccessControl,
      ...membershipsFallback,
    ],
    globalRole,
  );

  const hadPersistedMembershipData = persistedAccessControl.length > 0;

  let accessControl = dedupeAccessControl(persistedAccessControl);

  // Backward compatibility: synthesize one membership for legacy users.
  if (!accessControl.length && aliasBusinessId) {
    accessControl = [
      {
        businessId: aliasBusinessId,
        role: globalRole ?? UNKNOWN_ROLE,
        status: 'active',
      },
    ];
  }

  const preferredBusinessId = resolveString(
    options.preferredBusinessId,
    root.activeBusinessId,
    root.activeBusinessID,
    root.currentBusinessId,
    root.currentBusinessID,
    root.lastSelectedBusinessId,
    root.defaultBusinessId,
    aliasBusinessId,
  );

  const activeBusinessId = resolveActiveBusinessId(
    preferredBusinessId,
    accessControl,
  );

  const activeAccessEntry =
    (activeBusinessId &&
      accessControl.find((entry) => entry.businessId === activeBusinessId)) ||
    null;

  const activeRole = isPlatformDev
    ? ('dev' as MembershipRole)
    : ((normalizeRoleId(activeAccessEntry?.role) as MembershipRole | null) ??
      (normalizeRoleId(globalRole) as MembershipRole | null) ??
      (normalizeRoleId(accessControl[0]?.role) as MembershipRole | null) ??
      null);

  const defaultBusinessId = resolveString(
    root.defaultBusinessId,
  );

  const lastSelectedBusinessId = resolveString(
    root.lastSelectedBusinessId,
  );

  const memberships: Membership[] = accessControl.map((entry) => ({
    uid: uid ?? undefined,
    userId: uid ?? undefined,
    businessId: entry.businessId,
    role: entry.role,
    status: entry.status ?? 'active',
    permissions: entry.permissions,
    email,
    displayName,
  }));

  const hasLegacyFlatFields = Boolean(
    resolveString(root.businessID, root.businessId, root.role),
  );
  const source: UserContextSource = hadPersistedMembershipData
    ? hasLegacyFlatFields
      ? 'hybrid'
      : 'new'
    : 'legacy';
  const availableBusinesses = buildAvailableBusinesses(accessControl);

  return {
    uid,
    email,
    displayName,
    role: activeRole,
    activeRole,
    businessID: activeBusinessId,
    businessId: activeBusinessId,
    activeBusinessId,
    defaultBusinessId,
    lastSelectedBusinessId,
    availableBusinesses,
    accessControl,
    memberships,
    hasMultipleBusinesses: accessControl.length > 1,
    isLegacyUser: source === 'legacy',
    source,
    rawUser: isRecord(user) ? (user as User) : null,
  };
};

export const normalizeUserForAuth = normalizeCurrentUserContext;
