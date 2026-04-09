#!/usr/bin/env node

import process from 'node:process';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'dev']);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeRole = (value) => toCleanString(value)?.toLowerCase() || null;

const parseArgs = (argv) => {
  const parsed = {
    username: null,
    businessId: null,
    cashCountId: null,
    approverUsername: null,
  };

  for (const token of argv.slice(2)) {
    const [rawKey, ...rest] = token.split('=');
    const value = rest.join('=');
    if (rawKey === '--username') {
      parsed.username = toCleanString(value)?.toLowerCase() || null;
    }
    if (rawKey === '--business-id') parsed.businessId = toCleanString(value);
    if (rawKey === '--cash-count-id') parsed.cashCountId = toCleanString(value);
    if (rawKey === '--approver-username') {
      parsed.approverUsername = toCleanString(value)?.toLowerCase() || null;
    }
  }

  if (!parsed.username || !parsed.businessId || !parsed.cashCountId) {
    console.error(
      'Usage: node .\\tools\\inspect-close-cash-count-context.mjs --username=<user> --business-id=<businessId> --cash-count-id=<cashCountId> [--approver-username=<user>]',
    );
    process.exit(2);
  }

  return parsed;
};

const resolveEmployeeId = (employee) => {
  if (!employee) return null;
  if (typeof employee === 'string') {
    const parts = employee.split('/');
    return parts[parts.length - 1] || null;
  }
  if (Array.isArray(employee?._path?.segments)) {
    return employee._path.segments.slice(-1)[0] || null;
  }
  if (Array.isArray(employee?._key?.path?.segments)) {
    return employee._key.path.segments.slice(-1)[0] || null;
  }
  return (
    toCleanString(employee.id) ||
    toCleanString(employee.uid) ||
    toCleanString(employee.userId) ||
    null
  );
};

const summarizeUserDoc = (uid, data) => {
  const root = asRecord(data);
  const legacyUser = asRecord(root.user);

  return {
    uid,
    activeBusinessId:
      toCleanString(root.activeBusinessId) ||
      toCleanString(legacyUser.activeBusinessId) ||
      null,
    businessID:
      toCleanString(root.businessID) || toCleanString(legacyUser.businessID) || null,
    businessId:
      toCleanString(root.businessId) || toCleanString(legacyUser.businessId) || null,
    role: normalizeRole(root.role) || normalizeRole(legacyUser.role),
    activeRole:
      normalizeRole(root.activeRole) || normalizeRole(legacyUser.activeRole),
    hasAccessControl:
      toArray(root.accessControl).length > 0 ||
      toArray(legacyUser.accessControl).length > 0,
    hasMemberships:
      toArray(root.memberships).length > 0 || toArray(legacyUser.memberships).length > 0,
  };
};

const summarizeMembership = (snap) => {
  if (!snap.exists) {
    return {
      exists: false,
      role: null,
      activeRole: null,
      status: null,
      active: null,
    };
  }

  const data = snap.data() || {};
  return {
    exists: true,
    role: normalizeRole(data.role),
    activeRole: normalizeRole(data.activeRole),
    status: toCleanString(data.status)?.toLowerCase() || null,
    active: typeof data.active === 'boolean' ? data.active : null,
  };
};

const summarizeCashCount = (snap) => {
  if (!snap.exists) {
    return {
      exists: false,
      state: null,
      openingEmployeeId: null,
    };
  }

  const cashCount = asRecord(snap.get('cashCount'));
  const opening = asRecord(cashCount.opening);
  return {
    exists: true,
    state: toCleanString(cashCount.state)?.toLowerCase() || null,
    openingEmployeeId: resolveEmployeeId(opening.employee),
  };
};

const buildEvaluation = ({
  businessId,
  userDocSummary,
  canonicalMembershipSummary,
  cashCountSummary,
}) => {
  const effectiveRole =
    canonicalMembershipSummary.role || userDocSummary.activeRole || userDocSummary.role;
  const canCloseAsOpeningEmployee =
    Boolean(userDocSummary.uid) &&
    Boolean(cashCountSummary.openingEmployeeId) &&
    userDocSummary.uid === cashCountSummary.openingEmployeeId;
  const canCloseAsManagerRole = MANAGER_ROLES.has(effectiveRole || '');

  let suspectedMismatch = null;
  let recommendedFix = 'No se detectó un mismatch evidente con los datos disponibles.';

  if (!canonicalMembershipSummary.exists) {
    suspectedMismatch = 'missing-canonical-membership';
    recommendedFix =
      'Crear o reparar businesses/{businessId}/members/{uid} para este usuario.';
  } else if (
    canonicalMembershipSummary.status &&
    ['inactive', 'suspended', 'revoked'].includes(canonicalMembershipSummary.status)
  ) {
    suspectedMismatch = 'inactive-membership';
    recommendedFix = 'Reactivar la membresía canónica del usuario en el negocio.';
  } else if (
    userDocSummary.activeBusinessId &&
    userDocSummary.activeBusinessId !== businessId
  ) {
    suspectedMismatch = 'active-business-mismatch';
    recommendedFix =
      'Alinear activeBusinessId del usuario con el negocio del cash count o cambiar al negocio correcto.';
  } else if (!cashCountSummary.exists) {
    suspectedMismatch = 'cash-count-not-found';
    recommendedFix = 'Validar el cashCountId y el negocio del cierre.';
  } else if (!canCloseAsOpeningEmployee && !canCloseAsManagerRole) {
    suspectedMismatch = 'insufficient-close-permission';
    recommendedFix =
      'Cerrar con el usuario que abrió la caja o asignar un rol manager/admin/owner válido.';
  }

  return {
    canCloseAsOpeningEmployee,
    canCloseAsManagerRole,
    suspectedMismatch,
    recommendedFix,
  };
};

const findUserByUsername = async (db, username) => {
  const normalized = toCleanString(username)?.toLowerCase();
  if (!normalized) return null;

  const directQuery = await db.collection('users').where('name', '==', normalized).limit(1).get();
  if (!directQuery.empty) {
    return directQuery.docs[0];
  }

  const legacyQuery = await db
    .collection('users')
    .where('user.name', '==', normalized)
    .limit(1)
    .get();

  return legacyQuery.empty ? null : legacyQuery.docs[0];
};

const app = initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore(app);

const main = async () => {
  const { username, businessId, cashCountId, approverUsername } = parseArgs(process.argv);

  const userDoc = await findUserByUsername(db, username);
  if (!userDoc) {
    throw new Error(`No se encontró users/{uid} para username "${username}".`);
  }

  const membershipSnap = await db
    .doc(`businesses/${businessId}/members/${userDoc.id}`)
    .get();
  const cashCountSnap = await db
    .doc(`businesses/${businessId}/cashCounts/${cashCountId}`)
    .get();

  const userDocSummary = summarizeUserDoc(userDoc.id, userDoc.data() || {});
  const canonicalMembershipSummary = summarizeMembership(membershipSnap);
  const cashCountSummary = summarizeCashCount(cashCountSnap);
  const evaluation = buildEvaluation({
    businessId,
    userDocSummary,
    canonicalMembershipSummary,
    cashCountSummary,
  });

  const result = {
    username,
    uid: userDoc.id,
    businessId,
    cashCountId,
    userDocSummary,
    canonicalMembershipSummary,
    cashCountSummary,
    evaluation: {
      canCloseAsOpeningEmployee: evaluation.canCloseAsOpeningEmployee,
      canCloseAsManagerRole: evaluation.canCloseAsManagerRole,
      suspectedMismatch: evaluation.suspectedMismatch,
    },
    recommendedFix: evaluation.recommendedFix,
  };

  if (approverUsername) {
    const approverDoc = await findUserByUsername(db, approverUsername);
    result.approver = approverDoc
      ? {
          username: approverUsername,
          uid: approverDoc.id,
          userDocSummary: summarizeUserDoc(approverDoc.id, approverDoc.data() || {}),
        }
      : {
          username: approverUsername,
          uid: null,
          userDocSummary: null,
        };
  }

  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error('[inspect-close-cash-count-context] failed');
  console.error(error);
  process.exitCode = 1;
});
