import type {
  MembershipRole,
  MembershipStatus,
  UserAccessControl,
} from '@/types/businessModels';
import { ensureArray } from '@/utils/array/ensureArray';
import { asRecord, type UnknownRecord } from '@/utils/object/record';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import { toCleanString } from '@/utils/text';

import type { AvailableBusinessContext } from '@/utils/auth-adapter';

export const ACTIVE_BUSINESS_STORAGE_KEY = 'activeBusinessId';

const isActiveStatus = (status: MembershipStatus): boolean => {
  const normalized = String(status || 'active').toLowerCase();
  return !['inactive', 'suspended', 'revoked', 'disabled'].includes(normalized);
};

const normalizeBusiness = (
  raw: UnknownRecord,
  fallbackRole: MembershipRole = 'unknown',
): AvailableBusinessContext | null => {
  const businessNode = asRecord(raw.business);
  const nestedBusinessNode = asRecord(businessNode.business);
  const businessId =
    toCleanString(raw.activeBusinessId) ||
    toCleanString(raw.businessId) ||
    toCleanString(raw.businessID) ||
    toCleanString(businessNode.id) ||
    null;

  if (!businessId) return null;

  const status = (toCleanString(raw.status) || 'active') as MembershipStatus;
  const role =
    (normalizeRoleId(raw.activeRole) as MembershipRole | null) ||
    (normalizeRoleId(raw.role) as MembershipRole | null) ||
    fallbackRole;
  const name =
    toCleanString(raw.name) ||
    toCleanString(raw.businessName) ||
    toCleanString(businessNode.name) ||
    toCleanString(nestedBusinessNode.name) ||
    `Negocio ${businessId}`;

  const rawIsActive = raw.isActive;
  const isActive =
    typeof rawIsActive === 'boolean' ? rawIsActive : isActiveStatus(status);

  return {
    businessId,
    name,
    role,
    status,
    isActive,
  };
};

const dedupeBusinesses = (
  businesses: AvailableBusinessContext[],
): AvailableBusinessContext[] => {
  const map = new Map<string, AvailableBusinessContext>();

  for (const business of businesses) {
    const existing = map.get(business.businessId);
    if (!existing) {
      map.set(business.businessId, business);
      continue;
    }

    map.set(business.businessId, {
      ...existing,
      name: existing.name || business.name,
      role: existing.role || business.role,
      status: existing.status || business.status,
      isActive: existing.isActive || business.isActive,
    });
  }

  return Array.from(map.values());
};

export const normalizeAvailableBusinesses = (
  user: unknown,
): AvailableBusinessContext[] => {
  const record = asRecord(user);

  const fromAvailableBusinesses = ensureArray(record.availableBusinesses)
    .map((item) => normalizeBusiness(asRecord(item)))
    .filter((item): item is AvailableBusinessContext => item !== null);

  const fromAccessControl = ensureArray(record.accessControl)
    .map((item) => normalizeBusiness(asRecord(item)))
    .filter((item): item is AvailableBusinessContext => item !== null);

  const fallbackLegacy = normalizeBusiness({
    activeBusinessId: record.activeBusinessId,
    businessId: record.businessId || record.businessID,
    activeRole: record.activeRole,
    role: record.role,
    status: 'active',
  });

  return dedupeBusinesses([
    ...fromAvailableBusinesses,
    ...fromAccessControl,
    ...(fallbackLegacy ? [fallbackLegacy] : []),
  ]);
};

export const resolveCurrentActiveBusinessId = (
  user: unknown,
): string | null => {
  const record = asRecord(user);
  return (
    toCleanString(record.activeBusinessId) ||
    toCleanString(record.businessID) ||
    toCleanString(record.businessId) ||
    null
  );
};

export const resolveCurrentActiveRole = (
  user: unknown,
): MembershipRole | null => {
  const record = asRecord(user);
  return (normalizeRoleId(record.activeRole) ||
    normalizeRoleId(record.role)) as MembershipRole | null;
};

export const getStoredActiveBusinessId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return toCleanString(
      window.localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY),
    );
  } catch {
    return null;
  }
};

export const setStoredActiveBusinessId = (businessId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, businessId);
  } catch {
    // Ignore storage errors.
  }
};

export const clearStoredActiveBusinessId = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
};

export const resolveAutoSelectedBusiness = (
  user: unknown,
  businesses: AvailableBusinessContext[],
): AvailableBusinessContext | null => {
  if (!businesses.length) return null;

  const activeBusinesses = businesses.filter((business) => business.isActive);
  const sourceList = activeBusinesses.length ? activeBusinesses : businesses;

  if (sourceList.length === 1) {
    return sourceList[0];
  }

  const preferredId = resolveBusinessPreferenceId(user);

  if (!preferredId) return null;
  return (
    sourceList.find((business) => business.businessId === preferredId) || null
  );
};

export const resolveBusinessPreferenceId = (user: unknown): string | null => {
  const record = asRecord(user);
  return (
    getStoredActiveBusinessId() ||
    toCleanString(record.lastSelectedBusinessId) ||
    toCleanString(record.defaultBusinessId) ||
    null
  );
};

export const buildAccessControlFromBusiness = (
  business: AvailableBusinessContext,
): UserAccessControl[] => [
  {
    businessId: business.businessId,
    businessName: business.name,
    role: business.role,
    status: business.status,
  },
];

export const buildAccessControlFromBusinesses = (
  businesses: AvailableBusinessContext[],
): UserAccessControl[] =>
  businesses.map((business) => ({
    businessId: business.businessId,
    businessName: business.name,
    role: business.role,
    status: business.status,
  }));
