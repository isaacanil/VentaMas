import bcrypt from 'bcryptjs';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import {
  normalizeRole,
  ROLE,
} from '../../../../core/constants/roles.constants.js';
import {
  asRecord,
  findMembershipForBusiness,
  normalizeMembershipEntries,
  toCleanString,
  INACTIVE_MEMBERSHIP_STATUSES,
} from '../utils/membershipContext.util.js';
import {
  assertMembershipWritePolicy,
  resolveMembershipWritePolicy,
} from '../utils/membershipWritePolicy.util.js';
import {
  resolveUserIdFromSessionToken,
  toMillis,
} from '../utils/sessionAuth.util.js';
import {
  upsertAccessControlEntry,
} from '../utils/membershipMirror.util.js';
import { LIMIT_OPERATION_KEYS } from '../../billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../billing/services/usage.service.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';

const USERS_COLLECTION = 'users';
const BUSINESS_OWNERSHIP_CLAIMS_COLLECTION = 'businessOwnershipClaims';

const CLAIM_TOKEN_DEFAULT_HOURS = 24;
const CLAIM_TOKEN_MIN_HOURS = 1;
const CLAIM_TOKEN_MAX_HOURS = 24 * 7;
const CLAIM_TOKEN_CREATOR_ROLES = new Set([ROLE.ADMIN, ROLE.OWNER, ROLE.DEV]);
const CLAIM_TOKEN_REDEEMER_ROLES = new Set([ROLE.ADMIN, ROLE.OWNER, ROLE.DEV]);

const usersCol = db.collection(USERS_COLLECTION);
const ownershipClaimsCol = db.collection(BUSINESS_OWNERSHIP_CLAIMS_COLLECTION);

const normalizeStatus = (rawStatus, rawActive) => {
  const status = toCleanString(rawStatus);
  if (status) return status.toLowerCase();
  if (rawActive === false) return 'inactive';
  return 'active';
};

const isRoleAllowedForClaim = (role, allowedRoles) => {
  const resolvedRole = normalizeRole(role || '');
  return allowedRoles.has(resolvedRole);
};

const hasPlatformDevRole = (userData) => {
  const root = asRecord(userData);
  const rootPlatform = asRecord(root.platformRoles);
  return rootPlatform.dev === true;
};

const resolveGlobalRole = (userData) => {
  if (hasPlatformDevRole(userData)) return ROLE.DEV;
  const root = asRecord(userData);
  return normalizeRole(root.activeRole || root.role || '');
};

const isMembershipActive = (membershipData) => {
  const status = normalizeStatus(membershipData?.status, membershipData?.active);
  return !INACTIVE_MEMBERSHIP_STATUSES.has(status);
};

const hasLegacyOwners = (businessData) => {
  const root = asRecord(businessData);
  const nestedBusiness = asRecord(root.business);
  const ownerUid = toCleanString(root.ownerUid) || toCleanString(nestedBusiness.ownerUid);
  if (ownerUid) return true;

  const rootOwners = Array.isArray(root.owners) ? root.owners : [];
  const nestedOwners = Array.isArray(nestedBusiness.owners)
    ? nestedBusiness.owners
    : [];
  return [...new Set([...rootOwners, ...nestedOwners].map((uid) => toCleanString(uid)).filter(Boolean))]
    .length > 0;
};

const hasActiveCanonicalOwner = (membersSnapshot) => {
  return membersSnapshot.docs.some((memberDoc) => {
    const memberData = memberDoc.data() || {};
    return isMembershipActive(memberData);
  });
};

const resolveUserIdFromSession = async (request) => {
  return resolveUserIdFromSessionToken({
    sessionToken: toCleanString(request?.data?.sessionToken),
    normalizeUserId: toCleanString,
    createAuthError: (message) =>
      new HttpsError('unauthenticated', message),
  });
};

const resolveAuthUserId = async (request) => {
  const fromSession = await resolveUserIdFromSession(request);
  return fromSession || request?.auth?.uid || null;
};

const resolveExpiresAt = (rawHours) => {
  const parsedHours = Number(rawHours || CLAIM_TOKEN_DEFAULT_HOURS);
  if (!Number.isFinite(parsedHours)) {
    throw new HttpsError('invalid-argument', 'expiresInHours invalido');
  }
  const clampedHours = Math.max(
    CLAIM_TOKEN_MIN_HOURS,
    Math.min(CLAIM_TOKEN_MAX_HOURS, Math.trunc(parsedHours)),
  );
  return Timestamp.fromMillis(Date.now() + clampedHours * 60 * 60 * 1000);
};

const normalizeClaimCode = (rawCode) => {
  const cleaned = toCleanString(rawCode);
  if (!cleaned) return null;
  return cleaned.toUpperCase().replace(/\s+/g, '');
};

const createClaimCode = () => `OWN-${nanoid(10).toUpperCase()}`;

const resolveBaseUrl = (rawBaseUrl) => {
  const cleaned = toCleanString(rawBaseUrl);
  if (!cleaned) return null;
  try {
    const parsed = new URL(cleaned);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
};

const assertActorCanManageOwnershipClaim = ({
  actorUserData,
  businessId,
  canonicalMembershipData,
}) => {
  const globalRole = resolveGlobalRole(actorUserData);
  if (globalRole === ROLE.DEV) {
    return true;
  }

  if (
    canonicalMembershipData &&
    isMembershipActive(canonicalMembershipData) &&
    isRoleAllowedForClaim(
      canonicalMembershipData.role,
      CLAIM_TOKEN_CREATOR_ROLES,
    )
  ) {
    return true;
  }

  const actorEntries = normalizeMembershipEntries(actorUserData);
  const membership = findMembershipForBusiness(actorEntries, businessId, {
    activeOnly: true,
  });
  const membershipRole = membership?.role || '';

  if (
    !membership ||
    !isRoleAllowedForClaim(membershipRole, CLAIM_TOKEN_CREATOR_ROLES)
  ) {
    throw new HttpsError(
      'permission-denied',
      'Solo admin/owner/dev pueden generar enlace de reclamo',
    );
  }

  return true;
};

const assertBusinessHasNoOwner = async (businessRef, businessData) => {
  if (hasLegacyOwners(businessData)) {
    throw new HttpsError(
      'failed-precondition',
      'El negocio ya tiene propietario registrado',
    );
  }

  const ownerMembersSnap = await businessRef
    .collection('members')
    .where('role', '==', ROLE.OWNER)
    .limit(20)
    .get();

  if (hasActiveCanonicalOwner(ownerMembersSnap)) {
    throw new HttpsError(
      'failed-precondition',
      'El negocio ya tiene propietario registrado',
    );
  }
};

export const createBusinessOwnershipClaimToken = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const actorUserId = await resolveAuthUserId(request);
  if (!actorUserId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const actorSnap = await usersCol.doc(actorUserId).get();
  if (!actorSnap.exists) {
    throw new HttpsError('not-found', 'Usuario actor no encontrado');
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const actorMemberSnap = await businessRef
    .collection('members')
    .doc(actorUserId)
    .get();

  assertActorCanManageOwnershipClaim({
    actorUserData: actorSnap.data() || {},
    businessId,
    canonicalMembershipData: actorMemberSnap.exists
      ? actorMemberSnap.data() || {}
      : null,
  });

  await assertBusinessHasNoOwner(businessRef, businessSnap.data() || {});

  const expiresAt = resolveExpiresAt(request?.data?.expiresInHours);
  const claimCode = createClaimCode();
  const codeHash = await bcrypt.hash(claimCode, 10);
  const claimRef = ownershipClaimsCol.doc();
  const codePrefix = claimCode.slice(0, 6);

  await claimRef.set({
    claimId: claimRef.id,
    businessId,
    status: 'active',
    maxUses: 1,
    usedCount: 0,
    codeHash,
    codePrefix,
    expiresAt,
    createdBy: actorUserId,
    usedBy: null,
    usedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const baseUrl = resolveBaseUrl(request?.data?.baseUrl);
  const claimUrl = baseUrl
    ? `${baseUrl}/claim-business?token=${encodeURIComponent(claimCode)}`
    : null;

  return {
    ok: true,
    claimId: claimRef.id,
    businessId,
    code: claimCode,
    claimUrl,
    expiresAt: expiresAt.toMillis(),
  };
});

export const redeemBusinessOwnershipClaimToken = onCall(async (request) => {
  const claimCode = normalizeClaimCode(request?.data?.token);
  if (!claimCode) {
    throw new HttpsError('invalid-argument', 'token es requerido');
  }

  const actorUserId = await resolveAuthUserId(request);
  if (!actorUserId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const codePrefix = claimCode.slice(0, 6);
  const candidatesSnap = await ownershipClaimsCol
    .where('status', '==', 'active')
    .where('codePrefix', '==', codePrefix)
    .limit(20)
    .get();

  if (candidatesSnap.empty) {
    throw new HttpsError('not-found', 'Token de reclamo invalido');
  }

  let matchedClaimSnap = null;
  for (const candidate of candidatesSnap.docs) {
    const data = candidate.data() || {};
    const codeHash = toCleanString(data.codeHash);
    if (!codeHash) continue;
    const matches = await bcrypt.compare(claimCode, codeHash);
    if (matches) {
      matchedClaimSnap = candidate;
      break;
    }
  }

  if (!matchedClaimSnap) {
    throw new HttpsError('not-found', 'Token de reclamo invalido');
  }

  const preflightBusinessId = toCleanString(matchedClaimSnap.get('businessId'));
  if (preflightBusinessId) {
    const actorUserRef = usersCol.doc(actorUserId);
    const [actorUserSnap, actorMemberSnap] = await Promise.all([
      actorUserRef.get(),
      db.doc(`businesses/${preflightBusinessId}/members/${actorUserId}`).get(),
    ]);
    const actorMemberships = actorUserSnap.exists
      ? normalizeMembershipEntries(actorUserSnap.data() || {}, {
        includeBusinessName: true,
      })
      : [];
    const alreadyTrackedMember =
      actorMemberSnap.exists ||
      Boolean(
        findMembershipForBusiness(actorMemberships, preflightBusinessId, {
          activeOnly: false,
        }),
      );

    if (!alreadyTrackedMember) {
      await assertBusinessSubscriptionAccess({
        businessId: preflightBusinessId,
        action: 'write',
        operation: LIMIT_OPERATION_KEYS.USER_CREATE,
      });
    }
  }

  const claimRef = matchedClaimSnap.ref;
  const userRef = usersCol.doc(actorUserId);
  let writePolicy;
  try {
    writePolicy = assertMembershipWritePolicy(resolveMembershipWritePolicy());
  } catch (policyError) {
    throw new HttpsError(
      'failed-precondition',
      policyError?.message || 'Configuracion de escritura invalida',
    );
  }

  let result = null;

  await db.runTransaction(async (tx) => {
    const freshClaimSnap = await tx.get(claimRef);
    if (!freshClaimSnap.exists) {
      throw new HttpsError('not-found', 'Token de reclamo no encontrado');
    }

    const freshClaim = freshClaimSnap.data() || {};
    const businessId = toCleanString(freshClaim.businessId);
    const status = toCleanString(freshClaim.status) || 'active';
    const usedCount = Number(freshClaim.usedCount || 0);
    const maxUses = Number(freshClaim.maxUses || 1);
    const expiresAtMillis = toMillis(freshClaim.expiresAt);

    if (!businessId) {
      throw new HttpsError('failed-precondition', 'Token sin negocio asociado');
    }
    if (status !== 'active') {
      throw new HttpsError('failed-precondition', 'Token no disponible');
    }
    if (expiresAtMillis && expiresAtMillis <= Date.now()) {
      throw new HttpsError('failed-precondition', 'Token expirado');
    }
    if (usedCount >= maxUses) {
      throw new HttpsError('failed-precondition', 'Token ya utilizado');
    }

    const businessRef = db.doc(`businesses/${businessId}`);
    const businessSnap = await tx.get(businessRef);
    if (!businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }
    const businessData = businessSnap.data() || {};

    if (hasLegacyOwners(businessData)) {
      throw new HttpsError(
        'failed-precondition',
        'El negocio ya tiene propietario registrado',
      );
    }

    const ownersQuery = businessRef
      .collection('members')
      .where('role', '==', ROLE.OWNER)
      .limit(20);
    const ownerMembersSnap = await tx.get(ownersQuery);
    if (hasActiveCanonicalOwner(ownerMembersSnap)) {
      throw new HttpsError(
        'failed-precondition',
        'El negocio ya tiene propietario registrado',
      );
    }

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }
    const userData = userSnap.data() || {};

    const globalRole = resolveGlobalRole(userData);
    const isPlatformDevActor = globalRole === ROLE.DEV;
    const memberships = normalizeMembershipEntries(userData, {
      includeBusinessName: true,
    });
    const membership = findMembershipForBusiness(memberships, businessId, {
      activeOnly: true,
    });
    const membershipRole = membership?.role || '';
    const actorMemberRef = db.doc(`businesses/${businessId}/members/${actorUserId}`);
    const actorMemberSnap = await tx.get(actorMemberRef);

    const canRedeemByCanonicalMembership =
      actorMemberSnap.exists &&
      isMembershipActive(actorMemberSnap.data() || {}) &&
      isRoleAllowedForClaim(
        actorMemberSnap.get('role'),
        CLAIM_TOKEN_REDEEMER_ROLES,
      );

    const canRedeemByUserMirror =
      membership &&
      isRoleAllowedForClaim(membershipRole, CLAIM_TOKEN_REDEEMER_ROLES);

    const canRedeem =
      globalRole === ROLE.DEV ||
      canRedeemByCanonicalMembership ||
      canRedeemByUserMirror;
    if (!canRedeem) {
      throw new HttpsError(
        'permission-denied',
        'Solo admin/owner/dev del negocio pueden reclamarlo',
      );
    }

    const businessNode = asRecord(businessData.business);
    const businessName = toCleanString(businessData.name) ||
      toCleanString(businessNode.name) ||
      null;
    const shouldCountUser =
      !actorMemberSnap.exists &&
      !membership;

    if (writePolicy.writeCanonical) {
      tx.set(
        actorMemberRef,
        {
          uid: actorUserId,
          userId: actorUserId,
          businessId,
          role: ROLE.ADMIN,
          status: 'active',
          source: 'ownership_claim_token',
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const mergedEntries = upsertAccessControlEntry(memberships, {
      businessId,
      role: ROLE.ADMIN,
      status: 'active',
      businessName,
    });

    const existingBusinessId =
      toCleanString(userData.businessID) || toCleanString(userData.businessId) || null;

    const userUpdatePayload = {
      accessControl: mergedEntries,
      activeBusinessId: businessId,
      lastSelectedBusinessId: businessId,
      updatedAt: FieldValue.serverTimestamp(),
      ...(isPlatformDevActor ? {} : { activeRole: ROLE.ADMIN }),
    };

    const shouldPromoteRole =
      !existingBusinessId || existingBusinessId === businessId;
    if (shouldPromoteRole) {
      Object.assign(userUpdatePayload, {
        ...(isPlatformDevActor ? {} : { activeRole: ROLE.ADMIN }),
      });
    }

    tx.set(userRef, userUpdatePayload, { merge: true });

    tx.set(
      businessRef,
      {
        ownerUid: actorUserId,
        owners: [actorUserId],
        billingContact: actorUserId,
        billingContactUid: actorUserId,
        updatedAt: FieldValue.serverTimestamp(),
        business: {
          ...businessNode,
          ownerUid: actorUserId,
          owners: [actorUserId],
          billingContact: actorUserId,
          billingContactUid: actorUserId,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    tx.set(
      claimRef,
      {
        status: usedCount + 1 >= maxUses ? 'used' : 'active',
        usedCount: usedCount + 1,
        usedBy: actorUserId,
        usedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (shouldCountUser) {
      await incrementBusinessUsageMetric({
        businessId,
        metricKey: 'usersTotal',
        incrementBy: 1,
        tx,
      });
    }

    result = {
      businessId,
      businessName,
      membershipRole: ROLE.ADMIN,
      globalRole: isPlatformDevActor ? ROLE.DEV : ROLE.ADMIN,
      isPlatformDev: isPlatformDevActor,
      userId: actorUserId,
    };
  });

  return {
    ok: true,
    ...result,
    message: 'Propiedad reclamada correctamente.',
  };
});
