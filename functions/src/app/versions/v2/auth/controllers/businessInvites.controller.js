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
  assertActiveMembershipForBusiness,
  assertMembershipRole,
  findMembershipForBusiness,
  normalizeMembershipEntries,
  toCleanString,
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
const BUSINESS_INVITES_COLLECTION = 'businessInvites';
const INVITE_DEFAULT_HOURS = 72;
const INVITE_MAX_HOURS = 24 * 7;
const INVITE_MIN_HOURS = 1;
const INVITE_ALLOWED_CREATOR_ROLES = new Set([ROLE.OWNER, ROLE.ADMIN, ROLE.DEV]);
const usersCol = db.collection(USERS_COLLECTION);
const businessInvitesCol = db.collection(BUSINESS_INVITES_COLLECTION);

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

const normalizeInviteRole = (rawRole) => {
  const role = normalizeRole(rawRole || ROLE.CASHIER) || ROLE.CASHIER;
  return role;
};

const resolveExpiresAt = (rawHours) => {
  const parsedHours = Number(rawHours || INVITE_DEFAULT_HOURS);
  if (!Number.isFinite(parsedHours)) {
    throw new HttpsError('invalid-argument', 'expiresInHours invalido');
  }
  const clampedHours = Math.max(
    INVITE_MIN_HOURS,
    Math.min(INVITE_MAX_HOURS, Math.trunc(parsedHours)),
  );
  return Timestamp.fromMillis(Date.now() + clampedHours * 60 * 60 * 1000);
};

const normalizeInviteCode = (rawCode) => {
  const cleaned = toCleanString(rawCode);
  if (!cleaned) return null;
  return cleaned.toUpperCase();
};

const createInviteCode = () => `VM-${nanoid(10).toUpperCase()}`;

export const createBusinessInvite = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  const role = normalizeInviteRole(request?.data?.role);
  const recipientEmail = toCleanString(request?.data?.recipientEmail);
  const deliveryChannel = toCleanString(request?.data?.deliveryChannel);

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

  const actorEntries = normalizeMembershipEntries(actorSnap.data() || {});
  const actorMembership = assertActiveMembershipForBusiness(
    actorEntries,
    businessId,
    'No tienes acceso activo al negocio',
  );
  assertMembershipRole(
    actorMembership,
    INVITE_ALLOWED_CREATOR_ROLES,
    'Solo owner/admin/dev pueden generar invitaciones',
  );

  const expiresAt = resolveExpiresAt(request?.data?.expiresInHours);
  const inviteCode = createInviteCode();
  const codeHash = await bcrypt.hash(inviteCode, 10);
  const inviteRef = businessInvitesCol.doc();

  await inviteRef.set({
    inviteId: inviteRef.id,
    businessId,
    role,
    status: 'active',
    maxUses: 1,
    usedCount: 0,
    codeHash,
    codePrefix: inviteCode.slice(0, 6),
    expiresAt,
    createdBy: actorUserId,
    usedBy: null,
    usedAt: null,
    delivery: {
      channel: deliveryChannel || 'copy',
      recipientEmail: recipientEmail || null,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    inviteId: inviteRef.id,
    businessId,
    role,
    code: inviteCode,
    expiresAt: expiresAt.toMillis(),
  };
});

export const redeemBusinessInvite = onCall(async (request) => {
  const inviteCode = normalizeInviteCode(request?.data?.code);
  if (!inviteCode) {
    throw new HttpsError('invalid-argument', 'code es requerido');
  }

  const actorUserId = await resolveAuthUserId(request);
  if (!actorUserId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const codePrefix = inviteCode.slice(0, 6);
  const candidatesSnap = await businessInvitesCol
    .where('status', '==', 'active')
    .where('codePrefix', '==', codePrefix)
    .limit(20)
    .get();

  if (candidatesSnap.empty) {
    throw new HttpsError('not-found', 'Codigo de invitacion invalido');
  }

  let matchedInviteSnap = null;
  for (const candidate of candidatesSnap.docs) {
    const data = candidate.data() || {};
    const codeHash = toCleanString(data.codeHash);
    if (!codeHash) continue;
    const matches = await bcrypt.compare(inviteCode, codeHash);
    if (matches) {
      matchedInviteSnap = candidate;
      break;
    }
  }

  if (!matchedInviteSnap) {
    throw new HttpsError('not-found', 'Codigo de invitacion invalido');
  }

  const inviteData = matchedInviteSnap.data() || {};
  const businessId = toCleanString(inviteData.businessId);
  const role = normalizeInviteRole(inviteData.role);
  const expiresAtMillis = toMillis(inviteData.expiresAt);
  const usedCount = Number(inviteData.usedCount || 0);
  const maxUses = Number(inviteData.maxUses || 1);
  const status = toCleanString(inviteData.status) || 'active';

  if (!businessId) {
    throw new HttpsError('failed-precondition', 'Invitacion sin negocio');
  }
  if (status !== 'active') {
    throw new HttpsError('failed-precondition', 'Invitacion no disponible');
  }
  if (expiresAtMillis && expiresAtMillis <= Date.now()) {
    throw new HttpsError('failed-precondition', 'Invitacion expirada');
  }
  if (usedCount >= maxUses) {
    throw new HttpsError('failed-precondition', 'Invitacion ya utilizada');
  }

  const userRef = usersCol.doc(actorUserId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  const existingEntries = normalizeMembershipEntries(userData, {
    includeBusinessName: true,
  });
  const existingMembership = findMembershipForBusiness(existingEntries, businessId, {
    activeOnly: true,
  });

  // Regla adoptada: si ya pertenece al negocio, no consumir el código.
  if (existingMembership) {
    return {
      ok: false,
      reason: 'already-member',
      businessId,
      role: existingMembership.role,
    };
  }

  const existingCanonicalMemberSnap = await db
    .doc(`businesses/${businessId}/members/${actorUserId}`)
    .get();
  if (!existingCanonicalMemberSnap.exists) {
    await assertBusinessSubscriptionAccess({
      businessId,
      action: 'write',
      operation: LIMIT_OPERATION_KEYS.USER_CREATE,
    });
  }

  const businessSnap = await db.doc(`businesses/${businessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }
  const businessNode = asRecord(businessSnap.get('business'));
  const businessName = toCleanString(businessNode.name) || null;

  const memberRef = db.doc(`businesses/${businessId}/members/${actorUserId}`);
  const inviteRef = matchedInviteSnap.ref;
  let writePolicy;
  try {
    writePolicy = assertMembershipWritePolicy(resolveMembershipWritePolicy());
  } catch (policyError) {
    throw new HttpsError(
      'failed-precondition',
      policyError?.message || 'Configuración de escritura inválida',
    );
  }

  await db.runTransaction(async (tx) => {
    const freshInviteSnap = await tx.get(inviteRef);
    if (!freshInviteSnap.exists) {
      throw new HttpsError('not-found', 'Invitacion no encontrada');
    }

    const freshInvite = freshInviteSnap.data() || {};
    const freshStatus = toCleanString(freshInvite.status) || 'active';
    const freshUsedCount = Number(freshInvite.usedCount || 0);
    const freshMaxUses = Number(freshInvite.maxUses || 1);
    const freshExpiresAt = toMillis(freshInvite.expiresAt);
    if (freshStatus !== 'active') {
      throw new HttpsError('failed-precondition', 'Invitacion no disponible');
    }
    if (freshExpiresAt && freshExpiresAt <= Date.now()) {
      throw new HttpsError('failed-precondition', 'Invitacion expirada');
    }
    if (freshUsedCount >= freshMaxUses) {
      throw new HttpsError('failed-precondition', 'Invitacion ya utilizada');
    }

    const existingMemberSnap = await tx.get(memberRef);

    if (writePolicy.writeCanonical) {
      tx.set(
        memberRef,
        {
          uid: actorUserId,
          userId: actorUserId,
          businessId,
          role,
          status: 'active',
          invitedBy: toCleanString(freshInvite.createdBy),
          source: 'invite_code',
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const userSnapTx = await tx.get(userRef);
    const userDataTx = userSnapTx.exists ? userSnapTx.data() || {} : {};
    const existingEntriesTx = normalizeMembershipEntries(userDataTx, {
      includeBusinessName: true,
    });
    const mergedEntries = upsertAccessControlEntry(existingEntriesTx, {
      businessId,
      role,
      status: 'active',
      businessName,
    });

    const existingBusinessId =
      toCleanString(userDataTx.businessID) || toCleanString(userDataTx.businessId) || null;

    const userUpdatePayload = {
      accessControl: mergedEntries,
      lastSelectedBusinessId: businessId,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existingBusinessId
        ? {}
        : {
          activeBusinessId: businessId,
          activeRole: role,
        }),
    };

    tx.set(userRef, userUpdatePayload, { merge: true });

    tx.set(
      inviteRef,
      {
        status: freshUsedCount + 1 >= freshMaxUses ? 'used' : 'active',
        usedCount: freshUsedCount + 1,
        usedBy: actorUserId,
        usedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (!existingMemberSnap.exists) {
      await incrementBusinessUsageMetric({
        businessId,
        metricKey: 'usersTotal',
        incrementBy: 1,
        tx,
      });
    }
  });

  return {
    ok: true,
    businessId,
    role,
    businessName,
  };
});
