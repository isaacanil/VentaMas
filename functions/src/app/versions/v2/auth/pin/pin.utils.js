import {
  normalizeRole,
  ROLE,
} from '../../../../core/constants/roles.constants.js';

const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
]);

const toArray = (value) => (Array.isArray(value) ? value : []);

export const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeStatus = (rawStatus, rawActive) => {
  const status = toCleanString(rawStatus);
  if (status) return status.toLowerCase();
  if (rawActive === false) return 'inactive';
  return 'active';
};

export const isMembershipActive = (entry) => {
  const data = asRecord(entry);
  const status = normalizeStatus(data.status, data.active);
  return !INACTIVE_MEMBERSHIP_STATUSES.has(status);
};

const normalizeMembershipRole = (value, fallback = ROLE.CASHIER) =>
  normalizeRole(value || fallback) || fallback;

const normalizeAccessControlEntry = (entry, fallbackRole) => {
  const record = asRecord(entry);
  const businessNode = asRecord(record.business);
  const businessId =
    toCleanString(record.businessId) ||
    toCleanString(record.businessID) ||
    toCleanString(businessNode.id) ||
    null;

  if (!businessId) return null;

  return {
    businessId,
    role: normalizeMembershipRole(record.role, fallbackRole),
    status: normalizeStatus(record.status, record.active),
  };
};

export const normalizeAccessControlEntries = (payload) => {
  const root = asRecord(payload);
  const fallbackRole = normalizeMembershipRole(
    root.activeRole || ROLE.CASHIER,
  );
  const rootAccessControl = toArray(root.accessControl);
  const rootMembershipsFallback = rootAccessControl.length
    ? []
    : toArray(root.memberships);

  const rawEntries = [
    ...rootAccessControl,
    ...rootMembershipsFallback,
  ];

  const byBusiness = new Map();
  for (const rawEntry of rawEntries) {
    const normalized = normalizeAccessControlEntry(rawEntry, fallbackRole);
    if (!normalized) continue;
    const existing = byBusiness.get(normalized.businessId);
    if (!existing) {
      byBusiness.set(normalized.businessId, normalized);
      continue;
    }
    const shouldReplace =
      !isMembershipActive(existing) && isMembershipActive(normalized);
    if (shouldReplace) {
      byBusiness.set(normalized.businessId, normalized);
    }
  }

  return Array.from(byBusiness.values());
};

export const findActiveMembershipForBusiness = (entries, businessId) => {
  const cleanedBusinessId = toCleanString(businessId);
  if (!cleanedBusinessId) return null;

  return (
    toArray(entries).find((entry) => {
      const record = asRecord(entry);
      if (record.businessId !== cleanedBusinessId) return false;
      return isMembershipActive(record);
    }) || null
  );
};

const resolvePrimaryBusinessId = (raw, entries) => {
  const root = asRecord(raw);

  const preferred =
    toCleanString(root.activeBusinessId) ||
    toCleanString(root.lastSelectedBusinessId) ||
    null;

  if (preferred && findActiveMembershipForBusiness(entries, preferred)) {
    return preferred;
  }

  if (preferred) return preferred;

  const firstActive = toArray(entries).find((entry) => isMembershipActive(entry));
  return firstActive?.businessId || null;
};

const resolveGlobalRole = (raw) => {
  const root = asRecord(raw);
  return normalizeMembershipRole(
    root.activeRole,
    ROLE.CASHIER,
  );
};

export const extractUserData = (snap) => {
  const raw = asRecord(snap?.data?.());
  const memberships = normalizeAccessControlEntries(raw);
  const businessId = resolvePrimaryBusinessId(raw, memberships);
  const activeMembership = findActiveMembershipForBusiness(
    memberships,
    businessId,
  );
  const globalRole = resolveGlobalRole(raw);
  const resolvedRole =
    normalizeMembershipRole(activeMembership?.role, globalRole) || globalRole;

  const user = {
    id: toCleanString(raw.id) || snap?.id || null,
    uid: toCleanString(raw.uid) || snap?.id || null,
    name: toCleanString(raw.name) || '',
    displayName:
      toCleanString(raw.displayName) ||
      toCleanString(raw.name) ||
      '',
    realName:
      toCleanString(raw.realName) || null,
    email: toCleanString(raw.email) || null,
    emailVerified: raw.emailVerified ?? false,
    active: raw.active ?? true,
    businessID: businessId,
    businessId,
    activeBusinessId: businessId,
    role: resolvedRole,
    activeRole: resolvedRole,
    memberships,
  };

  return {
    raw,
    user,
    authorizationPins: asRecord(raw.authorizationPins),
    legacyPin: asRecord(raw.authorizationPin),
  };
};
