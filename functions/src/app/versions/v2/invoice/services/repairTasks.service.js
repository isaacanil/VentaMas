import { https, logger } from 'firebase-functions';

import { db, FieldValue } from '../../../../core/config/firebase.js';
import { ROLE, normalizeRole } from '../../../../core/constants/roles.constants.js';
import {
  INACTIVE_MEMBERSHIP_STATUSES,
  asRecord,
  findMembershipForBusiness,
  normalizeMembershipEntries,
  toCleanString,
} from '../../auth/utils/membershipContext.util.js';
import { auditSafe } from './audit.service.js';

export const ALLOWED_TASKS = new Set([
  'createCanonicalInvoice',
  'attachToCashCount',
  'setupAR',
  'setupInsuranceAR',
  'consumeCreditNotes',
  'closePreorder',
  'updateInventory',
]);

export const DEFAULT_TASKS = ['createCanonicalInvoice', 'attachToCashCount'];

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
  AUDIT: new Set([ROLE.OWNER, ROLE.ADMIN, ROLE.MANAGER, ROLE.DEV]),
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

const resolveRootRole = (userData) => {
  const root = asRecord(userData);
  return normalizeRole(root.role || '') || '';
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

  throw new https.HttpsError(
    'permission-denied',
    'No autorizado para este negocio',
  );
}

export function sanitizeTasks(value) {
  if (!value) return DEFAULT_TASKS;
  if (!Array.isArray(value)) {
    throw new https.HttpsError(
      'invalid-argument',
      'tasks debe ser un arreglo de strings',
    );
  }
  const unique = Array.from(new Set(value.map((task) => String(task || ''))));
  if (!unique.length) return DEFAULT_TASKS;
  const invalid = unique.filter((task) => !ALLOWED_TASKS.has(task));
  if (invalid.length) {
    throw new https.HttpsError(
      'invalid-argument',
      `Tareas no soportadas: ${invalid.join(', ')}`,
    );
  }
  return unique;
}

export async function getTaskTemplate({ businessId, invoiceId, type }) {
  const templateSnap = await db
    .collection(`businesses/${businessId}/invoicesV2/${invoiceId}/outbox`)
    .where('type', '==', type)
    .limit(1)
    .get();

  if (templateSnap.empty) {
    throw new https.HttpsError(
      'not-found',
      `No se encontró una tarea '${type}' para reutilizar`,
    );
  }

  const doc = templateSnap.docs[0];
  const data = doc.data();
  if (!data?.payload) {
    throw new https.HttpsError(
      'failed-precondition',
      `La tarea '${type}' no tiene un payload reutilizable`,
    );
  }

  return data.payload;
}

export async function enqueueRepairTask({
  businessId,
  invoiceId,
  type,
  payload,
  authUid,
  reason,
  invoice,
}) {
  const outboxCol = db.collection(
    `businesses/${businessId}/invoicesV2/${invoiceId}/outbox`,
  );

  const pendingSnap = await outboxCol
    .where('type', '==', type)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    return { status: 'skipped', reason: 'pending_task_exists' };
  }

  const taskRef = outboxCol.doc();
  const normalizedPayload = {
    ...payload,
    businessId: payload?.businessId || businessId,
    userId: payload?.userId || invoice?.userId || null,
  };

  await taskRef.set({
    id: taskRef.id,
    type,
    status: 'pending',
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    payload: normalizedPayload,
    manualRetry: true,
    requestedBy: authUid,
    requestedReason: reason || null,
  });

  await auditSafe({
    businessId,
    invoiceId,
    event: 'manual_task_enqueued',
    data: {
      type,
      requestedBy: authUid,
      payloadKeys: Object.keys(normalizedPayload || {}),
    },
  });

  return { status: 'scheduled', taskId: taskRef.id };
}

export async function scheduleRepairTasks({
  businessId,
  invoiceId,
  taskTypes,
  authUid,
  reason,
  invoice,
}) {
  if (!Array.isArray(taskTypes) || !taskTypes.length) {
    return [];
  }
  const results = [];
  const uniqueTasks = Array.from(new Set(taskTypes));
  for (const type of uniqueTasks) {
    try {
      const templatePayload = await getTaskTemplate({
        businessId,
        invoiceId,
        type,
      });
      const result = await enqueueRepairTask({
        businessId,
        invoiceId,
        type,
        payload: templatePayload,
        authUid,
        reason,
        invoice,
      });
      results.push({ type, ...result });
    } catch (taskError) {
      logger.error('scheduleRepairTasks error', {
        type,
        businessId,
        invoiceId,
        error: taskError?.message,
      });
      results.push({
        type,
        status: 'error',
        reason: taskError?.message || 'Error desconocido',
      });
    }
  }
  return results;
}
