import { https, logger } from 'firebase-functions';

import { db } from '../../../../core/config/firebase.js';
import { ROLE, normalizeRole } from '../../../../core/constants/roles.constants.js';
import {
  INACTIVE_MEMBERSHIP_STATUSES,
  asRecord,
  findMembershipForBusiness,
  normalizeMembershipEntries,
  toCleanString,
} from '../utils/membershipContext.util.js';

const GLOBAL_UNSCOPED_ROLES = new Set([ROLE.DEV]);

export const MEMBERSHIP_ROLE_GROUPS = Object.freeze({
  INVOICE_OPERATOR: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.MANAGER,
    ROLE.CASHIER,
    ROLE.BUYER,
    ROLE.DEV,
  ]),
  MAINTENANCE: new Set([ROLE.OWNER, ROLE.ADMIN, ROLE.DEV]),
  ACCOUNTING_READ: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.MANAGER,
    ROLE.ACCOUNTANT,
    ROLE.CONTROLLER,
    ROLE.AUDITOR,
    ROLE.DEV,
  ]),
  ACCOUNTING_WRITE: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.ACCOUNTANT,
    ROLE.CONTROLLER,
    ROLE.DEV,
  ]),
  ACCOUNTING_ADMIN: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.CONTROLLER,
    ROLE.DEV,
  ]),
  FINANCIAL_DOCUMENT_VOID: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.MANAGER,
    ROLE.ACCOUNTANT,
    ROLE.CONTROLLER,
    ROLE.DEV,
  ]),
  TREASURY_OPERATOR: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.MANAGER,
    ROLE.ACCOUNTANT,
    ROLE.CONTROLLER,
    ROLE.DEV,
  ]),
  FINANCE_CONFIG: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.ACCOUNTANT,
    ROLE.CONTROLLER,
    ROLE.DEV,
  ]),
  AUDIT: new Set([
    ROLE.OWNER,
    ROLE.ADMIN,
    ROLE.MANAGER,
    ROLE.ACCOUNTANT,
    ROLE.CONTROLLER,
    ROLE.AUDITOR,
    ROLE.DEV,
  ]),
});

const normalizeAllowedRoles = (allowedRoles) => {
  if (!allowedRoles) return null;
  const normalized = Array.from(allowedRoles)
    .map((role) => normalizeRole(role || ''))
    .filter(Boolean);
  if (!normalized.length) return null;
  return new Set(normalized);
};

const assertAllowedRole = (role, allowedRoles) => {
  const normalizedSet = normalizeAllowedRoles(allowedRoles);
  if (!normalizedSet) return;

  const normalizedRole = normalizeRole(role || ROLE.CASHIER) || ROLE.CASHIER;
  if (!normalizedSet.has(normalizedRole)) {
    throw new https.HttpsError(
      'permission-denied',
      'No autorizado para esta operación',
    );
  }
};

const resolveMembershipStatus = (rawStatus) =>
  toCleanString(rawStatus) || 'active';

const isActiveMembershipStatus = (status) =>
  !INACTIVE_MEMBERSHIP_STATUSES.has(resolveMembershipStatus(status));

const getCanonicalMembershipForBusiness = async ({ authUid, businessId }) => {
  if (!authUid || !businessId) return null;
  const memberRef = db.doc(`businesses/${businessId}/members/${authUid}`);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) return null;
  const data = memberSnap.data() || {};
  return {
    businessId,
    role: normalizeRole(data.role || ROLE.CASHIER) || ROLE.CASHIER,
    status: resolveMembershipStatus(data.status),
    source: 'canonical',
  };
};

const resolveLegacyScopedBusinessId = (userData) => {
  const root = asRecord(userData);
  return (
    toCleanString(root.activeBusinessId) ||
    toCleanString(root.businessID) ||
    toCleanString(root.businessId) ||
    toCleanString(root.lastSelectedBusinessId) ||
    toCleanString(root.defaultBusinessId) ||
    null
  );
};

const hasPlatformDevPrivileges = (userData) => {
  const root = asRecord(userData);
  const platformRoles = asRecord(root.platformRoles);
  const platformNode = asRecord(root.platform);
  return (
    normalizeRole(root.activeRole || root.role || '') === ROLE.DEV ||
    root.isDev === true ||
    platformRoles.dev === true ||
    platformNode.dev === true
  );
};

const resolveRootRole = (userData) => {
  if (hasPlatformDevPrivileges(userData)) {
    return ROLE.DEV;
  }
  const root = asRecord(userData);
  return normalizeRole(root.activeRole || root.role || '') || '';
};

export async function getUserAccessProfile(authUid) {
  if (!authUid) {
    return {
      userSnap: null,
      memberships: [],
      scopedBusinessId: null,
      rootRole: '',
      hasGlobalUnscopedAccess: false,
    };
  }

  const userSnap = await db.doc(`users/${authUid}`).get();
  if (!userSnap.exists) {
    return {
      userSnap,
      memberships: [],
      scopedBusinessId: null,
      rootRole: '',
      hasGlobalUnscopedAccess: false,
    };
  }

  const userData = userSnap.data() || {};
  const memberships = normalizeMembershipEntries(userData);
  const scopedBusinessId = resolveLegacyScopedBusinessId(userData);
  const rootRole = resolveRootRole(userData);

  return {
    userSnap,
    memberships,
    scopedBusinessId,
    rootRole,
    hasGlobalUnscopedAccess: GLOBAL_UNSCOPED_ROLES.has(rootRole),
  };
}

export async function getUserBusinessScope(authUid) {
  const profile = await getUserAccessProfile(authUid);
  if (profile.scopedBusinessId) return profile.scopedBusinessId;
  if (profile.memberships.length === 1) {
    return profile.memberships[0].businessId || null;
  }
  return null;
}

export async function assertUserAccess({
  authUid,
  businessId,
  userBusinessId,
  allowedRoles,
}) {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new https.HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!authUid) {
    throw new https.HttpsError('unauthenticated', 'Autenticación requerida');
  }

  const profile = await getUserAccessProfile(authUid);
  if (!profile.userSnap?.exists) {
    throw new https.HttpsError('permission-denied', 'Usuario no encontrado');
  }

  if (profile.hasGlobalUnscopedAccess) {
    const globalRole = profile.rootRole || ROLE.DEV;
    assertAllowedRole(globalRole, allowedRoles);
    return {
      businessId: normalizedBusinessId,
      role: globalRole,
      status: 'active',
      source: 'global-role',
    };
  }

  const canonicalMembership = await getCanonicalMembershipForBusiness({
    authUid,
    businessId: normalizedBusinessId,
  });
  if (canonicalMembership) {
    if (!isActiveMembershipStatus(canonicalMembership.status)) {
      throw new https.HttpsError(
        'permission-denied',
        'Tu membresía en este negocio no está activa',
      );
    }
    assertAllowedRole(canonicalMembership.role, allowedRoles);
    return canonicalMembership;
  }

  const activeMembership = findMembershipForBusiness(
    profile.memberships,
    normalizedBusinessId,
    { activeOnly: true },
  );
  if (activeMembership) {
    assertAllowedRole(activeMembership.role, allowedRoles);
    logger.info('[multi-business] auth fallback source used', {
      authUid,
      businessId: normalizedBusinessId,
      source: 'user-cache',
    });
    return {
      businessId: activeMembership.businessId,
      role: activeMembership.role,
      status: activeMembership.status || 'active',
      source: 'user-cache',
    };
  }

  const scopedBusinessId = toCleanString(userBusinessId) || profile.scopedBusinessId;
  if (scopedBusinessId && scopedBusinessId !== normalizedBusinessId) {
    throw new https.HttpsError(
      'permission-denied',
      'No autorizado para este negocio',
    );
  }

  if (scopedBusinessId === normalizedBusinessId) {
    const fallbackRole = profile.rootRole || ROLE.CASHIER;
    assertAllowedRole(fallbackRole, allowedRoles);
    logger.info('[multi-business] auth fallback source used', {
      authUid,
      businessId: normalizedBusinessId,
      source: 'legacy-scope',
    });
    return {
      businessId: normalizedBusinessId,
      role: fallbackRole,
      status: 'active',
      source: 'legacy-scope',
    };
  }

  throw new https.HttpsError(
    'permission-denied',
    'No autorizado para este negocio',
  );
}
