import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../core/config/firebase.js';
import {
  normalizeRole,
  ROLE,
} from '../../../../core/constants/roles.constants.js';
import {
  normalizeMembershipEntries,
  toCleanString,
} from './membershipContext.util.js';

export const INACTIVE_USER_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
  'disabled',
  'blocked',
]);

export const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
  'disabled',
]);

export const BUSINESS_BLOCKED_STATUSES = new Set([
  'inactive',
  'suspended',
  'offboarded',
  'closed',
  'disabled',
  'blocked',
]);

export const BUSINESS_READ_ONLY_STATUSES = new Set(['read_only', 'readonly']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeStatus = (status, active) => {
  const cleaned = toCleanString(status);
  if (cleaned) return cleaned.toLowerCase();
  if (active === false) return 'inactive';
  return 'active';
};

const resolveBusinessIdFromEntry = (entry) => {
  const record = asRecord(entry);
  const businessNode = asRecord(record.business);
  return (
    toCleanString(record.businessId) ||
    toCleanString(record.businessID) ||
    toCleanString(businessNode.id) ||
    toCleanString(businessNode.businessId) ||
    toCleanString(businessNode.businessID) ||
    null
  );
};

const collectBusinessIdsFromEntries = (entries) =>
  toArray(entries).map(resolveBusinessIdFromEntry).filter(Boolean);

export const hasPlatformDevAccess = (userData) => {
  const root = asRecord(userData);
  const platformRoles = asRecord(root.platformRoles);
  const nestedUser = asRecord(root.user);
  const nestedPlatformRoles = asRecord(nestedUser.platformRoles);

  return (
    platformRoles.dev === true ||
    nestedPlatformRoles.dev === true ||
    normalizeRole(root.activeRole || root.role || '') === ROLE.DEV
  );
};

export const isUserAccountActive = (userData) => {
  const root = asRecord(userData);
  const status = toCleanString(root.status)?.toLowerCase() || null;
  return root.active !== false && !INACTIVE_USER_STATUSES.has(status);
};

export const assertUserAccountActive = (userData) => {
  if (isUserAccountActive(userData)) return;
  throw new HttpsError(
    'permission-denied',
    'Tu usuario esta inactivo. Contacta soporte para reactivar el acceso.',
  );
};

export const resolveBusinessOperationalStatus = (businessData) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);
  return (
    toCleanString(root.status)?.toLowerCase() ||
    toCleanString(root.accessStatus)?.toLowerCase() ||
    toCleanString(businessNode.status)?.toLowerCase() ||
    toCleanString(businessNode.accessStatus)?.toLowerCase() ||
    'active'
  );
};

export const businessAllowsMemberRead = (status) =>
  !BUSINESS_BLOCKED_STATUSES.has(String(status || 'active').toLowerCase());

export const businessAllowsMemberWrite = (status) => {
  const normalized = String(status || 'active').toLowerCase();
  return (
    businessAllowsMemberRead(normalized) &&
    !BUSINESS_READ_ONLY_STATUSES.has(normalized)
  );
};

export const assertBusinessAllowsMemberRead = (businessData) => {
  const status = resolveBusinessOperationalStatus(businessData);
  if (businessAllowsMemberRead(status)) return status;
  throw new HttpsError(
    'failed-precondition',
    `El negocio esta en estado ${status} y no permite acceso de usuarios.`,
  );
};

export const isMembershipActive = (membershipData) => {
  const record = asRecord(membershipData);
  const status = normalizeStatus(record.status, record.active);
  return !INACTIVE_MEMBERSHIP_STATUSES.has(status);
};

export const extractCandidateBusinessIds = (userData) => {
  const root = asRecord(userData);
  return [
    ...new Set(
      [
        toCleanString(root.activeBusinessId),
        toCleanString(root.lastSelectedBusinessId),
        toCleanString(root.defaultBusinessId),
        toCleanString(root.businessID),
        toCleanString(root.businessId),
        ...collectBusinessIdsFromEntries(root.accessControl),
        ...collectBusinessIdsFromEntries(root.memberships),
        ...collectBusinessIdsFromEntries(root.availableBusinesses),
      ].filter(Boolean),
    ),
  ];
};

const defaultLoadBusiness = async (businessId) => {
  const snap = await db.doc(`businesses/${businessId}`).get();
  return {
    exists: snap.exists,
    data: snap.exists ? snap.data() || {} : null,
  };
};

const defaultLoadMembership = async ({ businessId, userId }) => {
  const snap = await db.doc(`businesses/${businessId}/members/${userId}`).get();
  return {
    exists: snap.exists,
    data: snap.exists ? snap.data() || {} : null,
  };
};

export const resolveUserBusinessAccessState = async ({
  userId,
  userData,
  loadBusiness = defaultLoadBusiness,
  loadMembership = defaultLoadMembership,
} = {}) => {
  const resolvedUserId = toCleanString(userId);
  if (!resolvedUserId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }

  assertUserAccountActive(userData);

  if (hasPlatformDevAccess(userData)) {
    return {
      allowed: true,
      policy: 'platform-dev',
      accessibleBusinesses: [],
      activeBusinessId: null,
      selectedMembership: null,
    };
  }

  const businessIds = extractCandidateBusinessIds(userData);
  if (!businessIds.length) {
    return {
      allowed: true,
      policy: 'no-business-context',
      accessibleBusinesses: [],
      activeBusinessId: null,
      selectedMembership: null,
    };
  }

  const cachedEntries = new Map(
    normalizeMembershipEntries(userData, { includeBusinessName: true }).map(
      (entry) => [entry.businessId, entry],
    ),
  );

  const accessibleBusinesses = [];
  for (const businessId of businessIds) {
    const [businessSnap, membershipSnap] = await Promise.all([
      loadBusiness(businessId),
      loadMembership({ businessId, userId: resolvedUserId }),
    ]);

    if (!businessSnap?.exists) continue;

    const businessStatus = resolveBusinessOperationalStatus(businessSnap.data);
    if (!businessAllowsMemberRead(businessStatus)) continue;

    const cachedEntry = cachedEntries.get(businessId) || null;
    if (membershipSnap?.exists) {
      const membershipData = asRecord(membershipSnap.data);
      if (!isMembershipActive(membershipData)) continue;

      accessibleBusinesses.push({
        businessId,
        role:
          normalizeRole(
            membershipData.role ||
              membershipData.activeRole ||
              cachedEntry?.role ||
              ROLE.CASHIER,
          ) || ROLE.CASHIER,
        membershipStatus: normalizeStatus(
          membershipData.status,
          membershipData.active,
        ),
        businessStatus,
        source: 'canonical',
      });
      continue;
    }

    if (cachedEntry && isMembershipActive(cachedEntry)) {
      accessibleBusinesses.push({
        businessId,
        role: normalizeRole(cachedEntry.role || ROLE.CASHIER) || ROLE.CASHIER,
        membershipStatus: normalizeStatus(
          cachedEntry.status,
          cachedEntry.active,
        ),
        businessStatus,
        source: 'legacy-cache',
      });
    }
  }

  if (!accessibleBusinesses.length) {
    throw new HttpsError(
      'permission-denied',
      'Tu usuario no tiene acceso activo a ningun negocio disponible.',
    );
  }

  const preferredBusinessId =
    toCleanString(asRecord(userData).activeBusinessId) ||
    toCleanString(asRecord(userData).lastSelectedBusinessId) ||
    toCleanString(asRecord(userData).defaultBusinessId) ||
    null;
  const selectedMembership =
    accessibleBusinesses.find(
      (business) => business.businessId === preferredBusinessId,
    ) || accessibleBusinesses[0];

  return {
    allowed: true,
    policy: 'active-business-access',
    accessibleBusinesses,
    activeBusinessId: selectedMembership.businessId,
    selectedMembership,
  };
};
