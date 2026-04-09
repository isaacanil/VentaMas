import { HttpsError } from 'firebase-functions/v2/https';

import {
  normalizeRole,
  ROLE,
} from '../../../../core/constants/roles.constants.js';

export const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
]);

const toArray = (value) => (Array.isArray(value) ? value : []);

const isRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

export const asRecord = (value) => (isRecord(value) ? value : {});

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

const normalizeMembershipRole = (value, fallback = ROLE.CASHIER) =>
  normalizeRole(value || fallback) || fallback;

export const normalizeMembershipEntries = (
  userData,
  options = {},
) => {
  const { includeBusinessName = false } = options;
  const root = asRecord(userData);
  const rootAccessControl = toArray(root.accessControl);
  const rootMembershipsFallback = rootAccessControl.length
    ? []
    : toArray(root.memberships);

  const rawEntries = [
    ...rootAccessControl,
    ...rootMembershipsFallback,
  ];

  const normalized = rawEntries
    .map((rawEntry) => {
      const entry = asRecord(rawEntry);
      const businessNode = asRecord(entry.business);
      const businessId =
        toCleanString(entry.businessId) ||
        toCleanString(entry.businessID) ||
        toCleanString(businessNode.id) ||
        null;

      if (!businessId) return null;

      const normalizedEntry = {
        businessId,
        role: normalizeMembershipRole(
          entry.role || root.activeRole,
          ROLE.CASHIER,
        ),
        status: normalizeStatus(entry.status, entry.active),
      };

      if (!includeBusinessName) return normalizedEntry;

      return {
        ...normalizedEntry,
        businessName:
          toCleanString(entry.businessName) ||
          toCleanString(entry.name) ||
          toCleanString(businessNode.name) ||
          null,
      };
    })
    .filter(Boolean);

  if (normalized.length) return normalized;

  const legacyBusinessId = toCleanString(root.activeBusinessId) || null;
  if (!legacyBusinessId) return [];

  const legacyEntry = {
    businessId: legacyBusinessId,
    role: normalizeMembershipRole(root.activeRole, ROLE.CASHIER),
    status: 'active',
  };

  if (!includeBusinessName) return [legacyEntry];
  return [{ ...legacyEntry, businessName: null }];
};

export const findMembershipForBusiness = (
  entries,
  businessId,
  options = {},
) => {
  const { activeOnly = false } = options;
  return (
    toArray(entries).find((entry) => {
      const record = asRecord(entry);
      if (record.businessId !== businessId) return false;
      if (!activeOnly) return true;
      return !INACTIVE_MEMBERSHIP_STATUSES.has(record.status);
    }) || null
  );
};

export const assertActiveMembershipForBusiness = (
  entries,
  businessId,
  message = 'No tienes acceso activo al negocio',
) => {
  const membership = findMembershipForBusiness(entries, businessId, {
    activeOnly: true,
  });
  if (!membership) {
    throw new HttpsError('permission-denied', message);
  }
  return membership;
};

export const assertMembershipRole = (
  membership,
  allowedRoles,
  message = 'No tienes permisos suficientes',
) => {
  const allowed = new Set(
    Array.from(allowedRoles || []).map((role) => normalizeMembershipRole(role)),
  );
  const resolvedRole = normalizeMembershipRole(membership?.role, ROLE.CASHIER);
  if (!allowed.has(resolvedRole)) {
    throw new HttpsError('permission-denied', message);
  }
  return resolvedRole;
};

export const getDistinctActiveBusinesses = (entries) => {
  const seen = new Set();
  const result = [];
  for (const entry of toArray(entries)) {
    const record = asRecord(entry);
    if (INACTIVE_MEMBERSHIP_STATUSES.has(record.status)) continue;
    if (seen.has(record.businessId)) continue;
    seen.add(record.businessId);
    result.push(record.businessId);
  }
  return result;
};
