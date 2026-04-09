import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../core/config/firebase.js';
import {
  normalizeRole,
  ROLE,
} from '../../../../core/constants/roles.constants.js';

import {
  extractUserData,
  findActiveMembershipForBusiness,
  isMembershipActive,
  normalizeAccessControlEntries,
  toCleanString,
} from './pin.utils.js';

export const loadUserDoc = async (uid) => {
  if (!uid) return null;
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap;
};

const toUnique = (values) => {
  const seen = new Set();
  const unique = [];
  for (const value of values) {
    const cleaned = toCleanString(value);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    unique.push(cleaned);
  }
  return unique;
};

const isDeveloperRole = (role) => normalizeRole(role || '') === ROLE.DEV;

const resolveExpectedBusinessId = ({ req, actorPayload, actorUser }) => {
  const data = req?.data || {};
  return (
    toCleanString(data.businessId) ||
    toCleanString(data.businessID) ||
    toCleanString(actorPayload?.businessId) ||
    toCleanString(actorPayload?.businessID) ||
    toCleanString(actorUser?.activeBusinessId) ||
    toCleanString(actorUser?.businessID) ||
    null
  );
};

const loadCanonicalMembership = async (businessId, uid) => {
  const cleanedBusinessId = toCleanString(businessId);
  const cleanedUid = toCleanString(uid);
  if (!cleanedBusinessId || !cleanedUid) return null;

  const membershipRef = db.doc(`businesses/${cleanedBusinessId}/members/${cleanedUid}`);
  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) return null;

  const membershipData = membershipSnap.data() || {};
  return {
    businessId: cleanedBusinessId,
    role: normalizeRole(membershipData.role || ROLE.CASHIER) || ROLE.CASHIER,
    active: isMembershipActive(membershipData),
    raw: membershipData,
  };
};

const resolveActorBusinessContext = async ({
  actorUid,
  actorUser,
  actorPayload,
  req,
}) => {
  const actorData = actorUser || {};
  const memberships = normalizeAccessControlEntries(actorData);

  const expectedBusinessId = resolveExpectedBusinessId({
    req,
    actorPayload,
    actorUser: actorData,
  });
  const candidateBusinessIds = toUnique([
    expectedBusinessId,
    actorData.activeBusinessId,
    actorData.businessID,
    ...memberships.map((entry) => entry.businessId),
  ]);

  const globalRole = normalizeRole(actorData.activeRole || actorData.role || '');
  const isGlobalDev = isDeveloperRole(globalRole);

  let selected = null;

  for (const businessId of candidateBusinessIds) {
    const canonicalMembership = await loadCanonicalMembership(businessId, actorUid);
    const fallbackMembership = findActiveMembershipForBusiness(
      memberships,
      businessId,
    );

    if (canonicalMembership?.active) {
      selected = {
        businessId,
        role: canonicalMembership.role,
        source: 'canonical',
      };
      break;
    }

    if (fallbackMembership && !expectedBusinessId) {
      selected = {
        businessId,
        role: normalizeRole(fallbackMembership.role || ROLE.CASHIER),
        source: 'fallback',
      };
      break;
    }

    if (fallbackMembership && expectedBusinessId && businessId === expectedBusinessId) {
      selected = {
        businessId,
        role: normalizeRole(fallbackMembership.role || ROLE.CASHIER),
        source: 'fallback',
      };
      break;
    }

    if (isGlobalDev && businessId === expectedBusinessId) {
      selected = {
        businessId,
        role: ROLE.DEV,
        source: 'developer-bypass',
      };
      break;
    }
  }

  if (!selected) {
    throw new HttpsError(
      'permission-denied',
      'Tu usuario no tiene un negocio activo con membresía válida.',
    );
  }

  const effectiveRole =
    isGlobalDev && selected.source !== 'canonical'
      ? ROLE.DEV
      : normalizeRole(selected.role || globalRole || ROLE.CASHIER);

  return {
    businessId: selected.businessId,
    role: effectiveRole || ROLE.CASHIER,
    source: selected.source,
  };
};

export const resolveActorContext = async (req) => {
  const actorPayload =
    req.data?.actor || req.data?.currentUser || req.data?.user || null;

  const candidateIds = [
    req.auth?.uid,
    actorPayload?.uid,
    actorPayload?.id,
    req.data?.actorUid,
    req.data?.uid,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0);

  // Try every possible actor id until we find a matching users/{id} doc.
  const uniqueCandidateIds = [];
  const seen = new Set();
  for (const value of candidateIds) {
    const trimmed = value.trim();
    if (!seen.has(trimmed)) {
      uniqueCandidateIds.push(trimmed);
      seen.add(trimmed);
    }
  }

  let actorUid = uniqueCandidateIds[0] || null;

  if (!actorUid) {
    throw new HttpsError(
      'unauthenticated',
      'Debes iniciar sesión para realizar esta operación.',
    );
  }

  let actorSnap = null;
  for (const candidateId of uniqueCandidateIds) {
    const snap = await loadUserDoc(candidateId);
    if (snap) {
      actorUid = candidateId;
      actorSnap = snap;
      break;
    }
  }

  if (!actorSnap) {
    console.error('[resolveActorContext] User not found', {
      actorUid,
      candidates: uniqueCandidateIds,
    });
    throw new HttpsError(
      'permission-denied',
      'No se encontro tu usuario (IDs probados: ' +
        uniqueCandidateIds.join(', ') +
        ').',
    );
  }

  const { user: actorUser } = extractUserData(actorSnap) || {};
  if (!actorUser) {
    throw new HttpsError('permission-denied', 'Perfil de usuario inválido.');
  }

  if (actorUser.active === false) {
    throw new HttpsError('permission-denied', 'Tu usuario está inactivo.');
  }

  const actorBusinessContext = await resolveActorBusinessContext({
    actorUid,
    actorUser,
    actorPayload,
    req,
  });

  return {
    actorUid,
    actorUser: {
      ...actorUser,
      businessID: actorBusinessContext.businessId,
      businessId: actorBusinessContext.businessId,
      activeBusinessId: actorBusinessContext.businessId,
      role: actorBusinessContext.role,
      activeRole: actorBusinessContext.role,
    },
    actorSnap,
    actorPayload,
    actorBusinessContext,
  };
};

export const hasActiveBusinessMembership = async ({
  userId,
  businessId,
  userData,
}) => {
  const cleanedBusinessId = toCleanString(businessId);
  const cleanedUserId = toCleanString(userId);
  if (!cleanedBusinessId || !cleanedUserId) return false;

  const canonicalMembership = await loadCanonicalMembership(
    cleanedBusinessId,
    cleanedUserId,
  );
  if (canonicalMembership?.active) {
    return true;
  }

  const fallbackEntries = normalizeAccessControlEntries(userData || {});
  return Boolean(
    findActiveMembershipForBusiness(fallbackEntries, cleanedBusinessId),
  );
};

export const listActiveBusinessMemberIds = async (businessId) => {
  const cleanedBusinessId = toCleanString(businessId);
  if (!cleanedBusinessId) return [];

  const membersSnap = await db
    .collection('businesses')
    .doc(cleanedBusinessId)
    .collection('members')
    .get();

  return membersSnap.docs
    .filter((docSnap) => isMembershipActive(docSnap.data() || {}))
    .map((docSnap) => docSnap.id);
};

export const loadUsersByIds = async (ids) => {
  const uniqueIds = toUnique(ids);
  if (!uniqueIds.length) return [];

  const refs = uniqueIds.map((uid) => db.collection('users').doc(uid));
  const chunks = [];
  const CHUNK_SIZE = 250;
  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    chunks.push(refs.slice(i, i + CHUNK_SIZE));
  }

  const snapshots = [];
  for (const chunk of chunks) {
    // Firestore Admin SDK accepts a variadic list of refs in getAll.
    const loaded = await db.getAll(...chunk);
    snapshots.push(...loaded);
  }

  return snapshots.filter((snap) => snap.exists);
};

export const loadActiveBusinessUserDocs = async (businessId) => {
  const memberIds = await listActiveBusinessMemberIds(businessId);
  if (!memberIds.length) return [];
  return loadUsersByIds(memberIds);
};

export const ensureBusinessMatch = async ({
  actorUid,
  actor,
  targetUid,
  target,
  businessId,
}) => {
  const actorBusiness =
    toCleanString(businessId) ||
    toCleanString(actor?.activeBusinessId) ||
    toCleanString(actor?.businessID) ||
    null;

  if (!actorBusiness) {
    throw new HttpsError(
      'permission-denied',
      'No se pudo resolver el negocio activo.',
    );
  }

  const isDevActor = isDeveloperRole(actor?.role || actor?.activeRole);

  const actorHasMembership = await hasActiveBusinessMembership({
    userId: actorUid || actor?.uid || actor?.id,
    businessId: actorBusiness,
    userData: actor || {},
  });

  if (!actorHasMembership && !isDevActor) {
    throw new HttpsError(
      'permission-denied',
      'No tienes acceso activo al negocio seleccionado.',
    );
  }

  const targetHasMembership = await hasActiveBusinessMembership({
    userId: targetUid || target?.uid || target?.id,
    businessId: actorBusiness,
    userData: target || {},
  });

  if (!targetHasMembership && !isDevActor) {
    throw new HttpsError(
      'permission-denied',
      'No tienes permisos para operar sobre este usuario.',
    );
  }

  return actorBusiness;
};


