import { HttpsError } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import {
  PLAN_CATALOG_STATUSES,
  PLAN_NOTICE_WINDOWS,
  PLAN_NOTICE_WINDOW_DEFAULT,
  PLAN_STATES,
} from '../config/planCatalog.constants.js';
import {
  asRecord,
  normalizeLimitValue,
  toCleanString,
  toFiniteNumber,
  toMillis,
} from '../utils/billingCommon.util.js';
import { normalizePlanEntitlements } from '../utils/planEntitlements.util.js';

const PLAN_CATALOG_COLLECTION = 'billingPlanCatalog';
const VERSION_SUBCOLLECTION = 'versions';

const NOTICE_WINDOW_SET = new Set(PLAN_NOTICE_WINDOWS);

const planCatalogCol = db.collection(PLAN_CATALOG_COLLECTION);

const normalizePlanCode = (planCode) => {
  const clean = toCleanString(planCode)?.toLowerCase();
  if (!clean) {
    throw new HttpsError('invalid-argument', 'planCode es requerido');
  }
  return clean;
};

const normalizePlanState = (rawState, fallback = 'draft') => {
  const state = toCleanString(rawState)?.toLowerCase() || fallback;
  if (!PLAN_STATES.has(state)) {
    throw new HttpsError('invalid-argument', `Estado de plan invalido: ${state}`);
  }
  return state;
};

const normalizePlanCatalogStatus = (rawStatus, fallback = 'active') => {
  const status = toCleanString(rawStatus)?.toLowerCase() || fallback;
  if (!PLAN_CATALOG_STATUSES.has(status)) {
    throw new HttpsError(
      'invalid-argument',
      `Estado de suscripción invalido: ${status}`,
    );
  }
  return status;
};

const normalizeNoticeWindowDays = (rawValue) => {
  if (rawValue == null) return PLAN_NOTICE_WINDOW_DEFAULT;
  const numeric = Math.trunc(Number(rawValue));
  if (!NOTICE_WINDOW_SET.has(numeric)) {
    throw new HttpsError(
      'invalid-argument',
      `noticeWindowDays debe ser uno de: ${PLAN_NOTICE_WINDOWS.join(', ')}`,
    );
  }
  return numeric;
};

const resolveNoticeWindowDaysOrDefault = (rawValue) => {
  if (rawValue == null) return PLAN_NOTICE_WINDOW_DEFAULT;
  const numeric = Math.trunc(Number(rawValue));
  return NOTICE_WINDOW_SET.has(numeric) ? numeric : PLAN_NOTICE_WINDOW_DEFAULT;
};

const normalizeMapOfNumbers = (value) => {
  const record = asRecord(value);
  const output = {};
  Object.entries(record).forEach(([key, rawValue]) => {
    const normalized = normalizeLimitValue(rawValue);
    if (normalized == null) {
      throw new HttpsError('invalid-argument', `Límite inválido en ${key}`);
    }
    output[key] = normalized;
  });
  return output;
};

const normalizeMapOfBooleans = (value) => {
  const record = asRecord(value);
  const output = {};
  Object.entries(record).forEach(([key, rawValue]) => {
    if (typeof rawValue !== 'boolean') {
      throw new HttpsError('invalid-argument', `Valor booleano inválido en ${key}`);
    }
    output[key] = rawValue;
  });
  return output;
};

const normalizeEntitlementPayload = (value) => {
  const body = asRecord(value);

  return normalizePlanEntitlements({
    modules: normalizeMapOfBooleans(body.modules),
    addons: normalizeMapOfBooleans(body.addons),
    capabilities: normalizeMapOfBooleans(body.capabilities),
    features: normalizeMapOfBooleans(body.features),
    moduleAccess: normalizeMapOfBooleans(body.moduleAccess),
    limits: body.limits,
  });
};

const buildVersionDocPayload = ({
  planCode,
  version,
  displayName,
  state,
  effectiveAtMillis,
  priceMonthly,
  currency,
  noticeWindowDays,
  limits,
  modules,
  addons,
  features,
  moduleAccess,
  actorUserId = null,
}) => ({
  planCode,
  version,
  displayName,
  state,
  effectiveAt: Timestamp.fromMillis(effectiveAtMillis),
  billingCycle: 'monthly',
  priceMonthly,
  currency,
  noticeWindowDays,
  limits,
  modules,
  addons,
  features,
  moduleAccess,
  updatedBy: actorUserId,
  updatedAt: FieldValue.serverTimestamp(),
});

const normalizeVersionId = (rawVersionId) => {
  const clean = toCleanString(rawVersionId);
  if (!clean) return null;
  return clean.replace(/\s+/g, '_');
};

const readPlanCatalogInitializedSample = async () => {
  const sampleSnap = await planCatalogCol.limit(1).get();
  return !sampleSnap.empty;
};

const assertPlanCatalogInitialized = async () => {
  const initialized = await readPlanCatalogInitializedSample();
  if (initialized) return;
  throw new HttpsError(
    'failed-precondition',
    'Catálogo de planes no inicializado. Debes sembrar billingPlanCatalog antes de usar billing.',
  );
};

const toVersionEntry = (planCode, rawVersion) => {
  const version = asRecord(rawVersion);
  const normalizedVersionId =
    normalizeVersionId(version.version || version.versionId || version.id) ||
    `v${Date.now()}`;
  const entitlements = normalizePlanEntitlements(version);

  return {
    planCode,
    versionId: normalizedVersionId,
    version: normalizedVersionId,
    displayName: toCleanString(version.displayName) || planCode.toUpperCase(),
    state: normalizePlanState(version.state || version.status || 'draft'),
    effectiveAt: toMillis(version.effectiveAt) || Date.now(),
    billingCycle: toCleanString(version.billingCycle) || 'monthly',
    currency: toCleanString(version.currency) || 'DOP',
    priceMonthly: toFiniteNumber(version.priceMonthly, 0),
    noticeWindowDays: resolveNoticeWindowDaysOrDefault(version.noticeWindowDays),
    limits: asRecord(version.limits),
    ...entitlements,
  };
};

const sortVersionsDesc = (versions) =>
  versions
    .slice()
    .sort((a, b) => (b.effectiveAt || 0) - (a.effectiveAt || 0));

const resolveCurrentVersion = ({
  versions,
  activeVersionId,
  atMillis = Date.now(),
}) => {
  if (!versions.length) return null;

  const activeById =
    versions.find((item) => item.versionId === activeVersionId) || null;
  if (activeById) return activeById;

  const publishedByDate =
    versions.find((item) => {
      if (item.state !== 'active' && item.state !== 'scheduled') return false;
      return item.effectiveAt <= atMillis;
    }) || null;
  if (publishedByDate) return publishedByDate;

  return versions.find((item) => item.state !== 'retired') || versions[0] || null;
};

const buildCatalogEntry = ({
  planCode,
  planData = {},
  versions = [],
}) => {
  const base = asRecord(planData);
  const normalizedVersions = sortVersionsDesc(
    versions.map((version) => toVersionEntry(planCode, version)),
  );
  const currentVersion = resolveCurrentVersion({
    versions: normalizedVersions,
    activeVersionId: toCleanString(base.activeVersionId),
  });
  const latestVersion = normalizedVersions[0] || currentVersion || null;

  return {
    planCode,
    displayName:
      toCleanString(base.displayName) ||
      toCleanString(currentVersion?.displayName) ||
      planCode.toUpperCase(),
    catalogStatus: normalizePlanCatalogStatus(base.catalogStatus || 'active'),
    isSystemBuiltin: base.isSystemBuiltin === true,
    activeVersionId:
      toCleanString(base.activeVersionId) ||
      toCleanString(currentVersion?.versionId) ||
      null,
    latestVersionId:
      toCleanString(base.latestVersionId) ||
      toCleanString(latestVersion?.versionId) ||
      null,
    versionCount: normalizedVersions.length,
    currentVersion,
    latestVersion,
    versions: normalizedVersions,
  };
};

export const listPlanCatalog = async () => {
  await assertPlanCatalogInitialized();
  const catalogSnap = await planCatalogCol.get();
  const planEntries = [];

  for (const planDoc of catalogSnap.docs) {
    const planCode = planDoc.id;
    const versionsSnap = await planDoc.ref.collection(VERSION_SUBCOLLECTION).get();
    const versions = versionsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      versionId: docSnap.id,
      ...docSnap.data(),
    }));

    planEntries.push(
      buildCatalogEntry({
        planCode,
        planData: planDoc.data() || {},
        versions,
      }),
    );
  }
  return planEntries.sort((a, b) =>
    String(a.displayName || a.planCode).localeCompare(
      String(b.displayName || b.planCode),
      'es',
    ),
  );
};

export const resolvePlanVersionSnapshot = async ({
  planCode,
  atMillis = Date.now(),
  allowInactiveFallback = false,
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const planRef = planCatalogCol.doc(normalizedPlanCode);
  const planSnap = await planRef.get();

  if (!planSnap.exists) {
    await assertPlanCatalogInitialized();
    throw new HttpsError('not-found', `No existe plan configurado para ${normalizedPlanCode}`);
  }

  const versionsSnap = await planRef.collection(VERSION_SUBCOLLECTION).get();
  if (versionsSnap.empty) {
    throw new HttpsError(
      'failed-precondition',
      `La suscripcion ${normalizedPlanCode} todavia no tiene versiones publicadas`,
    );
  }

  const versions = versionsSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .map((version) => ({
      ...version,
      effectiveAtMs: toMillis(version.effectiveAt),
    }))
    .sort((a, b) => (a.effectiveAtMs || 0) - (b.effectiveAtMs || 0));

  const activeByDate =
    versions
      .slice()
      .reverse()
      .find((item) => {
        const state = toCleanString(item.state);
        if (state !== 'active' && state !== 'scheduled') return false;
        if (!item.effectiveAtMs) return false;
        return item.effectiveAtMs <= atMillis;
      }) || null;

  const fallbackVersion =
    versions
      .slice()
      .reverse()
      .find((item) => normalizePlanState(item.state || 'draft') !== 'retired') ||
    null;
  const resolved = activeByDate || (allowInactiveFallback ? fallbackVersion : null);

  if (!resolved) {
    throw new HttpsError(
      'failed-precondition',
      `El plan ${normalizedPlanCode} no tiene una version vigente para asignarse`,
    );
  }

  const entitlements = normalizePlanEntitlements(resolved);

  return {
    planCode: normalizedPlanCode,
    version: resolved.version || resolved.id,
    displayName: toCleanString(resolved.displayName) || normalizedPlanCode.toUpperCase(),
    status: toCleanString(resolved.state) || 'active',
    effectiveAt: resolved.effectiveAtMs || atMillis,
    billingCycle: toCleanString(resolved.billingCycle) || 'monthly',
    currency: toCleanString(resolved.currency) || 'DOP',
    priceMonthly: toFiniteNumber(resolved.priceMonthly, 0),
    noticeWindowDays: resolveNoticeWindowDaysOrDefault(resolved.noticeWindowDays),
    limits: asRecord(resolved.limits),
    ...entitlements,
  };
};

export const upsertPlanCatalogVersion = async ({
  planCode,
  versionId,
  payload,
  actorUserId = null,
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const body = asRecord(payload);
  const normalizedVersionId =
    normalizeVersionId(versionId) ||
    normalizeVersionId(body.version) ||
    `v${Date.now()}`;

  const displayName =
    toCleanString(body.displayName) || normalizedPlanCode.toUpperCase();
  const state = normalizePlanState(body.state || 'draft');
  const effectiveAtMillis = toMillis(body.effectiveAt) || Date.now();
  const currency = toCleanString(body.currency) || 'DOP';
  const priceMonthly = toFiniteNumber(body.priceMonthly, 0);
  const noticeWindowDays = normalizeNoticeWindowDays(body.noticeWindowDays);
  const limits = normalizeMapOfNumbers(body.limits);
  const { modules, addons, features, moduleAccess } =
    normalizeEntitlementPayload(body);

  const planRef = planCatalogCol.doc(normalizedPlanCode);
  const planSnap = await planRef.get();
  const currentCatalogStatus = planSnap.exists
    ? normalizePlanCatalogStatus(planSnap.get('catalogStatus') || 'active')
    : 'active';
  if (currentCatalogStatus === 'retired') {
    throw new HttpsError(
      'failed-precondition',
      'La suscripción está retirada. Reactívala antes de crear nuevas versiones.',
    );
  }
  const versionRef = planRef.collection(VERSION_SUBCOLLECTION).doc(normalizedVersionId);

  const versionPayload = buildVersionDocPayload({
    planCode: normalizedPlanCode,
    version: normalizedVersionId,
    displayName,
    state,
    effectiveAtMillis,
    priceMonthly,
    currency,
    noticeWindowDays,
    limits,
    modules,
    addons,
    features,
    moduleAccess,
    actorUserId,
  });

  await versionRef.set(
    {
      ...versionPayload,
      createdBy: actorUserId,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await planRef.set(
    {
      planCode: normalizedPlanCode,
      displayName,
      catalogStatus: currentCatalogStatus,
      latestVersionId: normalizedVersionId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUserId,
      ...(state === 'active' ? { activeVersionId: normalizedVersionId } : {}),
    },
    { merge: true },
  );

  return { ok: true, planCode: normalizedPlanCode, versionId: normalizedVersionId };
};

export const upsertPlanCatalogDefinition = async ({
  planCode,
  payload,
  actorUserId = null,
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const body = asRecord(payload);
  const displayName =
    toCleanString(body.displayName) || normalizedPlanCode.toUpperCase();
  const catalogStatus = normalizePlanCatalogStatus(body.catalogStatus || 'active');

  const planRef = planCatalogCol.doc(normalizedPlanCode);
  const planSnap = await planRef.get();
  await planRef.set(
    {
      planCode: normalizedPlanCode,
      displayName,
      catalogStatus,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUserId,
      ...(!planSnap.exists
        ? {
          createdAt: FieldValue.serverTimestamp(),
          createdBy: actorUserId,
        }
        : {}),
    },
    { merge: true },
  );

  return {
    ok: true,
    planCode: normalizedPlanCode,
    displayName,
    catalogStatus,
  };
};

export const publishPlanCatalogVersion = async ({
  planCode,
  versionId,
  effectiveAt,
  noticeWindowDays,
  actorUserId = null,
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const normalizedVersionId = normalizeVersionId(versionId);
  if (!normalizedVersionId) {
    throw new HttpsError('invalid-argument', 'versionId es requerido');
  }

  const planRef = planCatalogCol.doc(normalizedPlanCode);
  const planSnap = await planRef.get();
  const currentCatalogStatus = planSnap.exists
    ? normalizePlanCatalogStatus(planSnap.get('catalogStatus') || 'active')
    : 'active';
  if (currentCatalogStatus === 'retired') {
    throw new HttpsError(
      'failed-precondition',
      'La suscripción está retirada. Reactívala antes de publicar una versión.',
    );
  }
  const versionRef = planRef.collection(VERSION_SUBCOLLECTION).doc(normalizedVersionId);
  const versionSnap = await versionRef.get();
  if (!versionSnap.exists) {
    throw new HttpsError('not-found', 'Versión de plan no encontrada');
  }
  const versionsSnap = await planRef.collection(VERSION_SUBCOLLECTION).get();

  const effectiveAtMillis = toMillis(effectiveAt) || Date.now();
  const now = Date.now();
  const nextState = effectiveAtMillis <= now ? 'active' : 'scheduled';
  const normalizedNoticeWindow = normalizeNoticeWindowDays(noticeWindowDays);

  await versionRef.set(
    {
      state: nextState,
      effectiveAt: Timestamp.fromMillis(effectiveAtMillis),
      noticeWindowDays: normalizedNoticeWindow,
      publishedBy: actorUserId,
      publishedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUserId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (nextState === 'active') {
    const siblingUpdates = versionsSnap.docs.map(async (docSnap) => {
      if (docSnap.id === normalizedVersionId) return;
      const siblingState = toCleanString(docSnap.get('state'));
      if (siblingState !== 'active') return;
      await docSnap.ref.set(
        {
          state: 'deprecated',
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actorUserId,
        },
        { merge: true },
      );
    });
    await Promise.allSettled(siblingUpdates);
  }

  await planRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUserId,
      ...(nextState === 'active' ? { activeVersionId: normalizedVersionId } : {}),
    },
    { merge: true },
  );

  return {
    ok: true,
    planCode: normalizedPlanCode,
    versionId: normalizedVersionId,
    state: nextState,
    effectiveAt: effectiveAtMillis,
    noticeWindowDays: normalizedNoticeWindow,
  };
};

export const updatePlanCatalogLifecycle = async ({
  planCode,
  lifecycleStatus,
  versionId = null,
  actorUserId = null,
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const planRef = planCatalogCol.doc(normalizedPlanCode);
  const planSnap = await planRef.get();
  if (!planSnap.exists) {
    throw new HttpsError('not-found', 'Suscripcion no encontrada');
  }

  if (!versionId) {
    const normalizedCatalogStatus = normalizePlanCatalogStatus(lifecycleStatus);
    await planRef.set(
      {
        planCode: normalizedPlanCode,
        catalogStatus: normalizedCatalogStatus,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUserId,
      },
      { merge: true },
    );

    return {
      ok: true,
      scope: 'plan',
      planCode: normalizedPlanCode,
      lifecycleStatus: normalizedCatalogStatus,
    };
  }

  const normalizedVersionId = normalizeVersionId(versionId);
  if (!normalizedVersionId) {
    throw new HttpsError('invalid-argument', 'versionId es requerido');
  }

  const normalizedState = normalizePlanState(lifecycleStatus);
  if (normalizedState !== 'deprecated' && normalizedState !== 'retired') {
    throw new HttpsError(
      'invalid-argument',
      'Solo puedes marcar versiones como deprecated o retired',
    );
  }

  const versionRef = planRef.collection(VERSION_SUBCOLLECTION).doc(normalizedVersionId);
  const versionSnap = await versionRef.get();
  if (!versionSnap.exists) {
    throw new HttpsError('not-found', 'Version no encontrada');
  }

  const currentState = normalizePlanState(versionSnap.get('state') || 'draft');
  if (
    normalizedState === 'retired' &&
    (currentState === 'active' ||
      currentState === 'scheduled' ||
      toCleanString(planSnap.get('activeVersionId')) === normalizedVersionId)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'No puedes retirar la version activa. Publica otra y deja esta como deprecated primero.',
    );
  }

  await versionRef.set(
    {
      state: normalizedState,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUserId,
      ...(normalizedState === 'deprecated'
        ? { deprecatedAt: FieldValue.serverTimestamp() }
        : { retiredAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  return {
    ok: true,
    scope: 'version',
    planCode: normalizedPlanCode,
    versionId: normalizedVersionId,
    lifecycleStatus: normalizedState,
  };
};

const assertPlanCatalogDeletable = async ({
  normalizedPlanCode,
  planRef,
  planSnap,
}) => {
  if (planSnap.get('isSystemBuiltin') === true) {
    throw new HttpsError(
      'failed-precondition',
      `La suscripcion ${normalizedPlanCode} es builtin del sistema y no puede eliminarse por completo desde el panel.`,
    );
  }

  if (!planSnap.exists) {
    throw new HttpsError('not-found', 'Suscripcion no encontrada');
  }

  const catalogStatus = normalizePlanCatalogStatus(
    planSnap.get('catalogStatus') || 'active',
  );
  if (catalogStatus !== 'retired') {
    throw new HttpsError(
      'failed-precondition',
      'Solo puedes eliminar definitivamente una suscripcion que ya esté retirada.',
    );
  }

  const blockers = [];
  const [businessesSnap, accountsSnap] = await Promise.all([
    db.collection('businesses').get(),
    db.collection('billingAccounts').get(),
  ]);

  const hasBusinessSnapshot = businessesSnap.docs.some((businessDoc) => {
    const businessData = businessDoc.data() || {};
    return resolveBusinessSubscriptionPlanId(businessData) === normalizedPlanCode;
  });

  if (hasBusinessSnapshot) {
    blockers.push('negocios con snapshot de suscripcion');
  }

  let hasSubscriptionHistory = false;
  let hasPaymentHistory = false;
  let hasCheckoutSessions = false;

  for (const accountDoc of accountsSnap.docs) {
    const checks = await Promise.all([
      hasSubscriptionHistory
        ? Promise.resolve({ empty: true })
        : accountDoc.ref
            .collection('subscriptions')
            .where('planId', '==', normalizedPlanCode)
            .limit(1)
            .get(),
      hasPaymentHistory
        ? Promise.resolve({ empty: true })
        : accountDoc.ref
            .collection('paymentHistory')
            .where('metadata.requestedPlanCode', '==', normalizedPlanCode)
            .limit(1)
            .get(),
      hasCheckoutSessions
        ? Promise.resolve({ empty: true })
        : accountDoc.ref
            .collection('checkoutSessions')
            .where('planCode', '==', normalizedPlanCode)
            .limit(1)
            .get(),
    ]);

    const [subscriptionHistorySnap, paymentHistorySnap, checkoutSessionsSnap] = checks;
    if (!subscriptionHistorySnap.empty) hasSubscriptionHistory = true;
    if (!paymentHistorySnap.empty) hasPaymentHistory = true;
    if (!checkoutSessionsSnap.empty) hasCheckoutSessions = true;

    if (hasSubscriptionHistory && hasPaymentHistory && hasCheckoutSessions) {
      break;
    }
  }

  if (hasSubscriptionHistory) blockers.push('historial de suscripciones en billingAccounts');
  if (hasPaymentHistory) blockers.push('historial de pagos asociado');
  if (hasCheckoutSessions) blockers.push('checkout sessions asociadas');

  if (blockers.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      `No puedes eliminar ${normalizedPlanCode} porque aún tiene referencias o historial: ${blockers.join(', ')}.`,
    );
  }

  const versionsSnap = await planRef.collection(VERSION_SUBCOLLECTION).get();
  return { versionsSnap };
};

export const deletePlanCatalogDefinition = async ({
  planCode,
  actorUserId = null,
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const planRef = planCatalogCol.doc(normalizedPlanCode);
  const planSnap = await planRef.get();

  const { versionsSnap } = await assertPlanCatalogDeletable({
    normalizedPlanCode,
    planRef,
    planSnap,
  });

  const batch = db.batch();
  versionsSnap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  batch.delete(planRef);
  await batch.commit();

  return {
    ok: true,
    planCode: normalizedPlanCode,
    deletedVersions: versionsSnap.size,
    deletedAt: Date.now(),
    deletedBy: toCleanString(actorUserId) || null,
  };
};

export const assertPlanCatalogAssignable = async (planCode) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const planSnap = await planCatalogCol.doc(normalizedPlanCode).get();

  if (!planSnap.exists) {
    await assertPlanCatalogInitialized();
    throw new HttpsError('not-found', `Suscripcion no encontrada: ${normalizedPlanCode}`);
  }

  const catalogStatus = normalizePlanCatalogStatus(
    planSnap.get('catalogStatus') || 'active',
  );
  if (catalogStatus !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      `La suscripcion ${normalizedPlanCode} esta ${catalogStatus} y no admite nuevas asignaciones`,
    );
  }

  return {
    ok: true,
    planCode: normalizedPlanCode,
    catalogStatus,
  };
};

export const activateDueScheduledPlanVersions = async ({
  nowMillis = Date.now(),
} = {}) => {
  const planSnap = await planCatalogCol.get();
  let activated = 0;
  const activatedPlanCodes = [];

  for (const planDoc of planSnap.docs) {
    const versionsSnap = await planDoc.ref.collection(VERSION_SUBCOLLECTION).get();
    if (versionsSnap.empty) continue;

    const dueScheduled = versionsSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((version) => {
        const state = toCleanString(version.state);
        const effectiveAtMs = toMillis(version.effectiveAt);
        return state === 'scheduled' && effectiveAtMs != null && effectiveAtMs <= nowMillis;
      })
      .sort((a, b) => (toMillis(a.effectiveAt) || 0) - (toMillis(b.effectiveAt) || 0));

    if (!dueScheduled.length) continue;

    const targetVersion = dueScheduled[dueScheduled.length - 1];

    const updates = versionsSnap.docs.map(async (versionDoc) => {
      const state = toCleanString(versionDoc.get('state'));
      const effectiveAtMs = toMillis(versionDoc.get('effectiveAt'));
      if (versionDoc.id === targetVersion.id) {
        await versionDoc.ref.set(
          {
            state: 'active',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        return;
      }
      if (
        state === 'active' ||
        (state === 'scheduled' &&
          effectiveAtMs != null &&
          effectiveAtMs <= nowMillis)
      ) {
        await versionDoc.ref.set(
          {
            state: 'deprecated',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    });

    await Promise.allSettled(updates);
    await planDoc.ref.set(
      {
        activeVersionId: targetVersion.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    activated += 1;
    activatedPlanCodes.push(planDoc.id);
  }

  return { ok: true, activated, activatedPlanCodes };
};

const resolveBusinessSubscriptionPlanId = (businessData) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(businessNode.subscription);
  return (
    toCleanString(rootSubscription.planId)?.toLowerCase() ||
    toCleanString(nestedSubscription.planId)?.toLowerCase() ||
    null
  );
};

const resolveAccountActivePlanId = async (accountRef) => {
  const subscriptionsSnap = await accountRef
    .collection('subscriptions')
    .orderBy('updatedAt', 'desc')
    .limit(20)
    .get();

  if (subscriptionsSnap.empty) return null;

  const docs = subscriptionsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  const activeDoc =
    docs.find(
      (item) => toCleanString(item.status)?.toLowerCase() === 'active',
    ) || docs[0];
  return toCleanString(activeDoc?.planId)?.toLowerCase() || null;
};

const collectViolationsByLimit = ({
  violationBuckets,
  key,
  entry,
  maxItems = 200,
}) => {
  if (!Array.isArray(violationBuckets[key])) {
    violationBuckets[key] = [];
    violationBuckets[`${key}Overflow`] = 0;
  }

  if (violationBuckets[key].length < maxItems) {
    violationBuckets[key].push(entry);
    return;
  }
  violationBuckets[`${key}Overflow`] += 1;
};

export const previewPlanCatalogImpact = async ({
  planCode,
  payload = {},
}) => {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const body = asRecord(payload);
  const limitsPayload = asRecord(body.limits);

  let limits = {};
  if (Object.keys(limitsPayload).length) {
    limits = normalizeMapOfNumbers(limitsPayload);
  } else {
    const resolved = await resolvePlanVersionSnapshot({
      planCode: normalizedPlanCode,
      allowInactiveFallback: true,
    });
    limits = asRecord(resolved.limits);
  }

  const maxBusinesses = normalizeLimitValue(limits.maxBusinesses);
  const maxMonthlyInvoices = normalizeLimitValue(limits.maxMonthlyInvoices);
  const maxUsers = normalizeLimitValue(limits.maxUsers);

  const violations = {};
  const totals = {
    maxBusinesses: 0,
    maxMonthlyInvoices: 0,
    maxUsers: 0,
  };
  const evaluated = {
    accounts: 0,
    businesses: 0,
  };

  const accountsSnap = await db.collection('billingAccounts').get();
  evaluated.accounts = accountsSnap.size;
  for (const accountDoc of accountsSnap.docs) {
    const accountPlanId = await resolveAccountActivePlanId(accountDoc.ref);
    if (accountPlanId !== normalizedPlanCode) continue;

    const linksSnap = await accountDoc.ref.collection('businessLinks').get();
    const businessesCount = linksSnap.size;
    if (
      Number.isFinite(maxBusinesses) &&
      maxBusinesses >= 0 &&
      businessesCount > maxBusinesses
    ) {
      totals.maxBusinesses += 1;
      collectViolationsByLimit({
        violationBuckets: violations,
        key: 'maxBusinesses',
        entry: {
          billingAccountId: accountDoc.id,
          current: businessesCount,
          limit: maxBusinesses,
        },
      });
    }
  }

  const businessesSnap = await db.collection('businesses').get();
  evaluated.businesses = businessesSnap.size;
  for (const businessDoc of businessesSnap.docs) {
    const businessData = businessDoc.data() || {};
    const businessPlanId = resolveBusinessSubscriptionPlanId(businessData);
    if (businessPlanId !== normalizedPlanCode) continue;

    const [usageSnap, membersSnap] = await Promise.all([
      businessDoc.ref.collection('usage').doc('current').get(),
      businessDoc.ref.collection('members').get(),
    ]);

    const usage = usageSnap.exists ? usageSnap.data() || {} : {};
    const monthlyInvoices = Number(usage.monthlyInvoices || 0);
    const usersCount = membersSnap.size;

    if (
      Number.isFinite(maxMonthlyInvoices) &&
      maxMonthlyInvoices >= 0 &&
      monthlyInvoices > maxMonthlyInvoices
    ) {
      totals.maxMonthlyInvoices += 1;
      collectViolationsByLimit({
        violationBuckets: violations,
        key: 'maxMonthlyInvoices',
        entry: {
          businessId: businessDoc.id,
          current: monthlyInvoices,
          limit: maxMonthlyInvoices,
        },
      });
    }

    if (Number.isFinite(maxUsers) && maxUsers >= 0 && usersCount > maxUsers) {
      totals.maxUsers += 1;
      collectViolationsByLimit({
        violationBuckets: violations,
        key: 'maxUsers',
        entry: {
          businessId: businessDoc.id,
          current: usersCount,
          limit: maxUsers,
        },
      });
    }
  }

  return {
    ok: true,
    planCode: normalizedPlanCode,
    limits,
    evaluated,
    totals,
    violations,
  };
};
