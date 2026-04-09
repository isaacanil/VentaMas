import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { URL } from 'node:url';

import { db, FieldValue } from '../../../../core/config/firebase.js';
import { MAIL_SECRETS } from '../../../../core/config/secrets.js';
import { BILLING_DEFAULT_PROVIDER } from '../config/planCatalog.constants.js';
import {
  toCleanString,
  toMillis,
  asRecord,
  toFiniteNumber,
} from '../utils/billingCommon.util.js';
import { normalizePlanEntitlements } from '../utils/planEntitlements.util.js';
import {
  assertBillingAccessForBusiness,
  getBusinessSubscriptionSnapshot,
} from '../utils/subscriptionAccess.util.js';
import {
  ensureBillingAccountForOwner,
  getBillingOverviewByBusiness,
  listBillingAccounts,
  resolveBillingAccountIdForOwner,
} from '../services/billingAccount.service.js';
import {
  assignSubscriptionToBillingAccount,
  ensureBusinessBillingSetup,
  getActiveSubscriptionForBillingAccount,
  refreshSubscriptionsForPlanCode,
} from '../services/subscriptionSnapshot.service.js';
import {
  assertPlanCatalogAssignable,
  deletePlanCatalogDefinition,
  listPlanCatalog,
  publishPlanCatalogVersion,
  previewPlanCatalogImpact,
  resolvePlanVersionSnapshot,
  updatePlanCatalogLifecycle,
  upsertPlanCatalogDefinition,
  upsertPlanCatalogVersion,
} from '../services/planCatalog.service.js';
import {
  getImplementedProviderIds,
  resolvePaymentProviderAdapter,
} from '../services/providerAdapter.service.js';

const USERS_COLLECTION = 'users';
const SESSION_COLLECTION = 'sessionTokens';
const PAYMENT_HISTORY_SUBCOLLECTION = 'paymentHistory';
const CHECKOUT_SESSIONS_SUBCOLLECTION = 'checkoutSessions';
const PUBLIC_PLAN_HIDDEN_CODES = new Set(['demo', 'legacy']);
const PUBLIC_PLAN_VISIBLE_STATES = new Set(['active', 'scheduled']);
const MOCK_SUBSCRIPTION_STATUSES = new Set([
  'none',
  'trialing',
  'active',
  'past_due',
  'paused',
  'canceled',
  'unpaid',
  'deprecated',
  'scheduled',
]);
const DEFAULT_PAYMENT_STATUS_BY_SUBSCRIPTION_STATUS = {
  active: 'paid',
  trialing: 'paid',
  scheduled: 'pending',
  past_due: 'failed',
  unpaid: 'failed',
  paused: 'pending',
  canceled: 'void',
  deprecated: 'void',
  none: 'canceled',
};
const SESSION_IDLE_TIMEOUT_MS = Number(process.env.CLIENT_AUTH_MAX_IDLE_MS) || 0;
const DISABLE_SESSION_EXPIRY =
  String(process.env.CLIENT_AUTH_DISABLE_SESSION_EXPIRY || '').toLowerCase() ===
  'true';

const usersCol = db.collection(USERS_COLLECTION);
const sessionsCol = db.collection(SESSION_COLLECTION);

const isUserDev = (userData) => {
  const root = asRecord(userData);
  const platformRoles = asRecord(root.platformRoles);
  return (
    platformRoles.dev === true ||
    toCleanString(root.activeRole)?.toLowerCase() === 'dev'
  );
};

const resolveUserIdFromSession = async (request) => {
  const sessionToken = toCleanString(request?.data?.sessionToken);
  if (!sessionToken) return null;

  const sessionRef = sessionsCol.doc(sessionToken);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new HttpsError('unauthenticated', 'Sesion invalida o expirada');
  }

  const data = sessionSnap.data() || {};
  const userId = toCleanString(data.userId);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Sesion sin usuario asociado');
  }

  if (!DISABLE_SESSION_EXPIRY) {
    const now = Date.now();
    const expiresAt = toMillis(data.expiresAt);
    if (expiresAt && expiresAt <= now) {
      throw new HttpsError('unauthenticated', 'La sesion ha expirado');
    }
    if (SESSION_IDLE_TIMEOUT_MS > 0) {
      const lastActivity = toMillis(data.lastActivity);
      if (lastActivity && now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
        throw new HttpsError(
          'unauthenticated',
          'Sesion cerrada por inactividad',
        );
      }
    }
  }

  await sessionRef.set(
    {
      lastActivity: FieldValue.serverTimestamp(),
      status: 'active',
    },
    { merge: true },
  );

  return userId;
};

const resolveAuthUser = async (request) => {
  const uidFromSession = await resolveUserIdFromSession(request);
  const userId = uidFromSession || request?.auth?.uid || null;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userSnap = await usersCol.doc(userId).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  return { userId, userData: userSnap.data() || {} };
};

const assertDeveloperAccess = (userData) => {
  if (!isUserDev(userData)) {
    throw new HttpsError(
      'permission-denied',
      'Solo usuarios dev pueden ejecutar esta operación',
    );
  }
};

const resolveBillingAccountIdFromBusiness = async (businessId) => {
  const businessSnap = await db.doc(`businesses/${businessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }
  const businessData = businessSnap.data() || {};
  const ownerUid =
    toCleanString(businessData.ownerUid) ||
    toCleanString(asRecord(businessData.business).ownerUid) ||
    toCleanString(businessData.billingContactUid) ||
    toCleanString(asRecord(businessData.business).billingContactUid) ||
    null;

  if (!ownerUid) {
    throw new HttpsError(
      'failed-precondition',
      'No se pudo resolver ownerUid para el negocio',
    );
  }

  const fallbackAccountId = resolveBillingAccountIdForOwner(ownerUid);
  const billingAccountId =
    toCleanString(businessData.billingAccountId) || fallbackAccountId;

  return { billingAccountId, ownerUid };
};

const resolveMockSubscriptionStatus = (rawStatus) => {
  const status = toCleanString(rawStatus)?.toLowerCase() || 'active';
  if (!MOCK_SUBSCRIPTION_STATUSES.has(status)) {
    throw new HttpsError(
      'invalid-argument',
      `Estado de suscripción no soportado para mock: ${status}`,
    );
  }
  return status;
};

const resolveUserEmail = (userData) => {
  const root = asRecord(userData);
  const profile = asRecord(root.profile);
  return toCleanString(root.email) || toCleanString(profile.email) || null;
};

const formatEffectiveDate = (value) => {
  const millis = toMillis(value);
  if (!millis) return 'pendiente de definir';
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date(millis));
};

const formatMoneyAmount = (amount, currency = 'DOP') => {
  const numericAmount = toFiniteNumber(amount, 0);
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: toCleanString(currency) || 'DOP',
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const formatLimitSummaryValue = (value) => {
  const numericValue = toFiniteNumber(value, null);
  if (numericValue == null) return 'Sin definir';
  if (numericValue < 0) return 'Ilimitado';
  return numericValue.toLocaleString('es-DO');
};

const ENTITLEMENT_GROUP_LABELS = {
  modules: 'Modulo',
  addons: 'Addon',
};

const buildPublicPlanCatalogEntries = ({
  planCatalog = [],
  currentPlanId = null,
}) =>
  planCatalog
    .map((rawPlan) => {
      const plan = asRecord(rawPlan);
      const planCode = toCleanString(plan.planCode)?.toLowerCase();
      if (!planCode) return null;

      const versions = Array.isArray(plan.versions) ? plan.versions : [];
      const currentVersion = asRecord(plan.currentVersion);
      const latestVersion = asRecord(plan.latestVersion);
      const visibleVersions = versions
        .map((item) => asRecord(item))
        .filter((item) =>
          PUBLIC_PLAN_VISIBLE_STATES.has(
            toCleanString(item.state)?.toLowerCase() || '',
          ),
        )
        .sort((left, right) => {
          const leftEffectiveAt = toMillis(left.effectiveAt) || 0;
          const rightEffectiveAt = toMillis(right.effectiveAt) || 0;
          return rightEffectiveAt - leftEffectiveAt;
        });
      const resolvedVersion =
        (PUBLIC_PLAN_VISIBLE_STATES.has(
          toCleanString(currentVersion.state)?.toLowerCase() || '',
        )
          ? currentVersion
          : null) ||
        visibleVersions[0] ||
        (PUBLIC_PLAN_VISIBLE_STATES.has(
          toCleanString(latestVersion.state)?.toLowerCase() || '',
        )
          ? latestVersion
          : null);
      if (!resolvedVersion || Object.keys(resolvedVersion).length === 0) {
        return null;
      }
      const versionState =
        toCleanString(resolvedVersion.state)?.toLowerCase() || null;
      const isCurrentPlan = currentPlanId === planCode;
      const isSelectable =
        toCleanString(plan.catalogStatus)?.toLowerCase() === 'active' &&
        versionState === 'active' &&
        !PUBLIC_PLAN_HIDDEN_CODES.has(planCode);

      const isUpcoming = versionState === 'scheduled';
      if (!isCurrentPlan && !isSelectable && !isUpcoming) return null;

      return {
        planCode,
        displayName:
          toCleanString(plan.displayName) ||
          toCleanString(resolvedVersion.displayName) ||
          planCode.toUpperCase(),
        priceMonthly: toFiniteNumber(resolvedVersion.priceMonthly, 0),
        currency: toCleanString(resolvedVersion.currency) || 'DOP',
        billingCycle: toCleanString(resolvedVersion.billingCycle) || 'monthly',
        limits: asRecord(resolvedVersion.limits),
        modules: asRecord(resolvedVersion.modules),
        addons: asRecord(resolvedVersion.addons),
        isCurrent: isCurrentPlan,
        isSelectable,
        isUpcoming,
        catalogStatus: toCleanString(plan.catalogStatus) || 'active',
        versionState,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.isCurrent && !right.isCurrent) return -1;
      if (!left.isCurrent && right.isCurrent) return 1;
      const leftPrice = toFiniteNumber(left.priceMonthly, 0);
      const rightPrice = toFiniteNumber(right.priceMonthly, 0);
      if (leftPrice !== rightPrice) return leftPrice - rightPrice;
      return String(left.displayName || left.planCode).localeCompare(
        String(right.displayName || right.planCode),
        'es',
      );
    });

const buildPlanChangeSummary = ({
  previousVersion,
  nextVersion,
}) => {
  const previous = asRecord(previousVersion);
  const next = asRecord(nextVersion);
  const changes = [];

  if (Object.keys(next).length === 0) {
    return changes;
  }

  const previousPrice = toFiniteNumber(previous.priceMonthly, 0);
  const nextPrice = toFiniteNumber(next.priceMonthly, 0);
  const currency =
    toCleanString(next.currency) || toCleanString(previous.currency) || 'DOP';
  if (previousPrice !== nextPrice) {
    changes.push(
      `Precio mensual: ${formatMoneyAmount(previousPrice, currency)} -> ${formatMoneyAmount(nextPrice, currency)}`,
    );
  }

  const previousLimits = asRecord(previous.limits);
  const nextLimits = asRecord(next.limits);
  const limitKeys = new Set([
    ...Object.keys(previousLimits),
    ...Object.keys(nextLimits),
  ]);
  for (const key of limitKeys) {
    const previousValue = toFiniteNumber(previousLimits[key], null);
    const nextValue = toFiniteNumber(nextLimits[key], null);
    if (previousValue === nextValue) continue;
    changes.push(
      `Limite ${key}: ${formatLimitSummaryValue(previousValue)} -> ${formatLimitSummaryValue(nextValue)}`,
    );
  }

  const previousEntitlements = normalizePlanEntitlements(previous);
  const nextEntitlements = normalizePlanEntitlements(next);
  ['modules', 'addons'].forEach((groupKey) => {
    const previousGroup = asRecord(previousEntitlements[groupKey]);
    const nextGroup = asRecord(nextEntitlements[groupKey]);
    const entitlementKeys = new Set([
      ...Object.keys(previousGroup),
      ...Object.keys(nextGroup),
    ]);
    for (const key of entitlementKeys) {
      const previousValue = previousGroup[key] === true;
      const nextValue = nextGroup[key] === true;
      if (previousValue === nextValue) continue;
      changes.push(
        `${ENTITLEMENT_GROUP_LABELS[groupKey] || groupKey} ${key}: ${nextValue ? 'habilitado' : 'deshabilitado'}`,
      );
    }
  });

  if (changes.length <= 12) return changes;
  return [
    ...changes.slice(0, 12),
    `Y ${changes.length - 12} cambios adicionales.`,
  ];
};

const buildPlanVersionNotice = ({
  displayName,
  planCode,
  versionId,
  effectiveAt,
  noticeWindowDays,
  changes = [],
}) => {
  const resolvedDisplayName =
    toCleanString(displayName) || toCleanString(planCode) || 'tu suscripcion';
  const effectiveAtLabel = formatEffectiveDate(effectiveAt);
  const subject = `Cambio programado en tu suscripción ${resolvedDisplayName}`;
  const changeItemsHtml = changes.length
    ? `
      <div style="margin-top: 16px;">
        <p style="margin: 0 0 8px;"><strong>Cambios que se aplicarán:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${changes.map((change) => `<li style="margin-bottom: 6px;">${change}</li>`).join('')}
        </ul>
      </div>
    `
    : '';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Actualización de tu suscripción</h2>
      <p style="margin: 0 0 16px;">
        Programamos una nueva versión para <strong>${resolvedDisplayName}</strong>.
      </p>
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc;">
        <p style="margin: 0 0 8px;"><strong>Código:</strong> ${planCode}</p>
        <p style="margin: 0 0 8px;"><strong>Versión:</strong> ${versionId}</p>
        <p style="margin: 0 0 8px;"><strong>Entrada en vigencia:</strong> ${effectiveAtLabel}</p>
        <p style="margin: 0;"><strong>Ventana de aviso:</strong> ${noticeWindowDays} días</p>
      </div>
      ${changeItemsHtml}
      <p style="margin-top: 16px; line-height: 1.6;">
        Cuando llegue la fecha programada, la nueva versión se activará automáticamente y la versión anterior quedará deprecada.
      </p>
    </div>
  `;
  const text = [
    `Actualizacion de suscripcion: ${resolvedDisplayName}`,
    `Codigo: ${planCode}`,
    `Version: ${versionId}`,
    `Entrada en vigencia: ${effectiveAtLabel}`,
    `Ventana de aviso: ${noticeWindowDays} dias`,
    '',
    ...(changes.length
      ? ['Cambios programados:', ...changes.map((change) => `- ${change}`), '']
      : []),
    'Cuando llegue la fecha programada, la nueva version se activara automaticamente y la version anterior quedara deprecada.',
  ].join('\n');

  return {
    subject,
    html,
    text,
  };
};

const sendPlanVersionNoticeEmails = async ({
  planCode,
  versionId,
  displayName,
  effectiveAt,
  noticeWindowDays,
  previousVersion,
  nextVersion,
}) => {
  let mailer;
  try {
    mailer = await import('../../../../core/config/mailer.js');
  } catch (error) {
    logger.warn('Unable to load mailer for plan notice', {
      planCode,
      versionId,
      error: error instanceof Error ? error.message : error,
    });
    return {
      recipientCount: 0,
      delivered: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const accountsSnap = await db.collection('billingAccounts').get();
  const recipientsByEmail = new Map();

  for (const accountDoc of accountsSnap.docs) {
    const activeSubscription = await getActiveSubscriptionForBillingAccount(accountDoc.id);
    const activePlanCode =
      toCleanString(activeSubscription?.planId)?.toLowerCase() || null;
    if (activePlanCode !== planCode) continue;

    const ownerUid = toCleanString(accountDoc.get('ownerUid'));
    if (!ownerUid) continue;

    const userSnap = await usersCol.doc(ownerUid).get();
    if (!userSnap.exists) continue;

    const email = resolveUserEmail(userSnap.data() || {});
    if (!email) continue;

    recipientsByEmail.set(email.toLowerCase(), {
      email,
      ownerUid,
      billingAccountId: accountDoc.id,
    });
  }

  const recipients = Array.from(recipientsByEmail.values());
  if (!recipients.length) {
    return {
      recipientCount: 0,
      delivered: 0,
      skipped: 0,
      failed: 0,
    };
  }

  if (typeof mailer.getTransport === 'function') {
    const transport = await mailer.getTransport();
    if (!transport) {
      return {
        recipientCount: recipients.length,
        delivered: 0,
        skipped: recipients.length,
        failed: 0,
      };
    }
  }

  const message = buildPlanVersionNotice({
    displayName,
    planCode,
    versionId,
    effectiveAt,
    noticeWindowDays,
    changes: buildPlanChangeSummary({
      previousVersion,
      nextVersion,
    }),
  });

  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      mailer.sendMail({
        to: recipient.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    ),
  );

  results.forEach((result) => {
    if (result.status === 'rejected') {
      failed += 1;
      return;
    }
    if (result.value?.skipped) {
      skipped += 1;
      return;
    }
    delivered += 1;
  });

  return {
    recipientCount: recipients.length,
    delivered,
    skipped,
    failed,
  };
};

const writePaymentHistoryItem = async ({
  billingAccountId,
  paymentId = null,
  amount,
  currency = 'DOP',
  provider = BILLING_DEFAULT_PROVIDER,
  status = 'paid',
  description = null,
  reference = null,
  source = 'billing_mock_flow',
  createdBy = null,
  metadata = null,
}) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  if (!normalizedBillingAccountId) {
    throw new HttpsError('invalid-argument', 'billingAccountId es requerido');
  }

  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new HttpsError('invalid-argument', 'amount debe ser mayor que cero');
  }

  const paymentHistoryCol = db
    .doc(`billingAccounts/${normalizedBillingAccountId}`)
    .collection(PAYMENT_HISTORY_SUBCOLLECTION);
  const normalizedPaymentId = toCleanString(paymentId);
  const paymentRef = normalizedPaymentId
    ? paymentHistoryCol.doc(normalizedPaymentId)
    : paymentHistoryCol.doc();

  await paymentRef.set(
    {
      paymentId: paymentRef.id,
      amount: numericAmount,
      currency: toCleanString(currency) || 'DOP',
      provider: toCleanString(provider) || BILLING_DEFAULT_PROVIDER,
      status: toCleanString(status) || 'paid',
      description: toCleanString(description) || null,
      reference: toCleanString(reference) || null,
      source: toCleanString(source) || 'billing_mock_flow',
      createdBy: toCleanString(createdBy),
      metadata: asRecord(metadata),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return paymentRef.id;
};

const resolveAmountFromGateway = (rawAmount) => {
  const numericAmount = Number(rawAmount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null;
  return numericAmount / 100;
};

const extractCheckoutMetadataFromUrl = (rawCheckoutUrl) => {
  const checkoutUrl = toCleanString(rawCheckoutUrl);
  if (!checkoutUrl) {
    return {
      orderNumber: null,
      amount: null,
      currencyCode: null,
    };
  }

  try {
    const parsedUrl = new URL(checkoutUrl);
    return {
      orderNumber: toCleanString(parsedUrl.searchParams.get('OrderNumber')),
      amount: resolveAmountFromGateway(parsedUrl.searchParams.get('Amount')),
      currencyCode: toCleanString(parsedUrl.searchParams.get('CurrencyCode')),
    };
  } catch (error) {
    console.warn('Unable to parse checkout metadata', {
      checkoutUrl,
      error: error instanceof Error ? error.message : error,
    });
    return {
      orderNumber: null,
      amount: null,
      currencyCode: null,
    };
  }
};

const normalizeCheckoutSessionAdapterResponse = (adapterResponse) => {
  if (typeof adapterResponse === 'string') {
    return {
      url: adapterResponse,
      checkoutSession: {},
    };
  }

  const payload = asRecord(adapterResponse);
  const url = toCleanString(payload.url);
  if (!url) {
    throw new HttpsError(
      'failed-precondition',
      'El proveedor de pago no devolvió una URL de checkout válida',
    );
  }

  return {
    url,
    checkoutSession: asRecord(payload.checkoutSession),
  };
};

const writePendingCheckoutSession = async ({
  billingAccountId,
  businessId,
  planCode,
  provider,
  actorUserId,
  returnUrl,
  checkoutUrl,
  checkoutSession = null,
}) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedPlanCode = toCleanString(planCode);
  if (!normalizedBillingAccountId || !normalizedBusinessId || !normalizedPlanCode) {
    return null;
  }

  const metadataFromUrl = extractCheckoutMetadataFromUrl(checkoutUrl);
  const checkoutSessionData = asRecord(checkoutSession);
  const normalizedOrderNumber =
    toCleanString(checkoutSessionData.orderNumber) ||
    toCleanString(metadataFromUrl.orderNumber);
  if (!normalizedOrderNumber) return null;

  const checkoutRef = db
    .doc(`billingAccounts/${normalizedBillingAccountId}`)
    .collection(CHECKOUT_SESSIONS_SUBCOLLECTION)
    .doc(normalizedOrderNumber);

  await checkoutRef.set(
    {
      orderNumber: normalizedOrderNumber,
      billingAccountId: normalizedBillingAccountId,
      businessId: normalizedBusinessId,
      planCode: normalizedPlanCode,
      provider: toCleanString(provider) || BILLING_DEFAULT_PROVIDER,
      status: 'pending',
      amount:
        toFiniteNumber(checkoutSessionData.amount, null) ??
        toFiniteNumber(metadataFromUrl.amount, null),
      currency:
        toCleanString(checkoutSessionData.currency) ||
        toCleanString(checkoutSessionData.currencyCode) ||
        toCleanString(metadataFromUrl.currencyCode) ||
        'DOP',
      returnUrl: toCleanString(returnUrl) || null,
      checkoutUrl: toCleanString(checkoutUrl),
      gatewaySessionId: toCleanString(checkoutSessionData.gatewaySessionId),
      gatewaySessionKey: toCleanString(checkoutSessionData.gatewaySessionKey),
      authorizeUrl: toCleanString(checkoutSessionData.authorizeUrl),
      apiBaseUrl: toCleanString(checkoutSessionData.apiBaseUrl),
      approvedUrl: toCleanString(checkoutSessionData.approvedUrl),
      declinedUrl: toCleanString(checkoutSessionData.declinedUrl),
      cancelUrl: toCleanString(checkoutSessionData.cancelUrl),
      sessionExpiresAt: toCleanString(checkoutSessionData.sessionExpiresAt),
      metadata: asRecord(checkoutSessionData.metadata),
      createdBy: toCleanString(actorUserId),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return normalizedOrderNumber;
};

const ACTIVE_CHECKOUT_PROVIDER_ID = 'cardnet';

const resolveRequestedPaymentProvider = ({
  requestedProvider,
}) => {
  const providerFromRequest = toCleanString(requestedProvider)?.toLowerCase();
  if (providerFromRequest === ACTIVE_CHECKOUT_PROVIDER_ID) {
    return providerFromRequest;
  }

  const envOverride =
    toCleanString(process.env.BILLING_CHECKOUT_PROVIDER_OVERRIDE)?.toLowerCase();
  if (envOverride === ACTIVE_CHECKOUT_PROVIDER_ID) return envOverride;

  return ACTIVE_CHECKOUT_PROVIDER_ID;
};

const TERMINAL_CHECKOUT_STATUSES = new Set(['paid', 'failed', 'void']);

export const getBillingOverview = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const { userId } = await resolveAuthUser(request);
  await assertBillingAccessForBusiness({
    businessId,
    actorUserId: userId,
    allowReadForAnyMember: true,
  });

  await ensureBusinessBillingSetup({ businessId, actorUserId: userId });
  const overview = await getBillingOverviewByBusiness({ businessId });
  const subscription = await getBusinessSubscriptionSnapshot(businessId);
  const planCatalog = await listPlanCatalog();
  const availablePlans = buildPublicPlanCatalogEntries({
    planCatalog,
    currentPlanId: toCleanString(subscription.planId)?.toLowerCase() || null,
  });

  return {
    ok: true,
    ...overview,
    activeSubscription: subscription.raw,
    availablePlans,
    providersImplemented: getImplementedProviderIds(),
  };
});

export const createSubscriptionCheckoutSession = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  const returnUrl = toCleanString(request?.data?.returnUrl);
  const targetPlanCode = toCleanString(request?.data?.planCode);
  const requestedProvider = toCleanString(request?.data?.provider);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const { userId } = await resolveAuthUser(request);
  await assertBillingAccessForBusiness({
    businessId,
    actorUserId: userId,
    allowRoles: ['owner', 'admin'],
  });

  await ensureBusinessBillingSetup({ businessId, actorUserId: userId });
  const subscriptionSnapshot = await getBusinessSubscriptionSnapshot(businessId);
  const { billingAccountId, ownerUid } = await resolveBillingAccountIdFromBusiness(
    businessId,
  );
  await ensureBillingAccountForOwner({ ownerUid, actorUserId: userId });

  const providerId = resolveRequestedPaymentProvider({
    requestedProvider,
  });
  const adapter = resolvePaymentProviderAdapter(providerId);
  const resolvedProviderId = toCleanString(adapter?.providerId) || providerId;
  let validatedTargetPlanCode = null;
  let selectedPlanSnapshot = null;

  if (targetPlanCode) {
    const normalizedTargetPlanCode = targetPlanCode.toLowerCase();
    if (normalizedTargetPlanCode === 'demo') {
      throw new HttpsError(
        'failed-precondition',
        'El plan demo solo se asigna durante el onboarding inicial.',
      );
    }
    if (normalizedTargetPlanCode === 'legacy') {
      throw new HttpsError(
        'failed-precondition',
        'El plan legacy no admite nuevas selecciones desde checkout.',
      );
    }
    await assertPlanCatalogAssignable(normalizedTargetPlanCode);
    selectedPlanSnapshot = await resolvePlanVersionSnapshot({
      planCode: normalizedTargetPlanCode,
    });
    validatedTargetPlanCode = normalizedTargetPlanCode;
  }

  const selectedPlanCode =
    validatedTargetPlanCode || subscriptionSnapshot.planId || 'legacy';
  const selectedCurrency =
    toCleanString(selectedPlanSnapshot?.currency) ||
    toCleanString(subscriptionSnapshot.raw?.currency) ||
    'DOP';
  const selectedAmount =
    toFiniteNumber(selectedPlanSnapshot?.priceMonthly, null) ??
    toFiniteNumber(subscriptionSnapshot.raw?.priceMonthly, null);

  const checkoutSessionResult = await adapter.createCheckoutSession({
    billingAccountId,
    businessId,
    returnUrl,
    actorUserId: userId,
    planCode: selectedPlanCode,
    currency: selectedCurrency,
    amount: selectedAmount,
  });
  const normalizedCheckoutSession =
    normalizeCheckoutSessionAdapterResponse(checkoutSessionResult);

  try {
    await writePendingCheckoutSession({
      billingAccountId,
      businessId,
      planCode: selectedPlanCode,
      provider: resolvedProviderId,
      actorUserId: userId,
      returnUrl,
      checkoutUrl: normalizedCheckoutSession.url,
      checkoutSession: normalizedCheckoutSession.checkoutSession,
    });
  } catch (error) {
    console.error('Unable to persist pending checkout session', {
      billingAccountId,
      businessId,
      planCode: selectedPlanCode,
      error: error instanceof Error ? error.message : error,
    });
  }

  return {
    ok: true,
    provider: resolvedProviderId,
    billingAccountId,
    businessId,
    planCode: selectedPlanCode,
    url: normalizedCheckoutSession.url,
  };
});

export const createSubscriptionBillingPortalSession = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  const returnUrl = toCleanString(request?.data?.returnUrl);
  const requestedProvider = toCleanString(request?.data?.provider);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const { userId } = await resolveAuthUser(request);
  await assertBillingAccessForBusiness({
    businessId,
    actorUserId: userId,
    allowRoles: ['owner', 'admin'],
  });

  await ensureBusinessBillingSetup({ businessId, actorUserId: userId });
  const subscriptionSnapshot = await getBusinessSubscriptionSnapshot(businessId);
  const { billingAccountId, ownerUid } = await resolveBillingAccountIdFromBusiness(
    businessId,
  );
  await ensureBillingAccountForOwner({ ownerUid, actorUserId: userId });

  const providerId = resolveRequestedPaymentProvider({
    requestedProvider,
  });
  const adapter = resolvePaymentProviderAdapter(providerId);
  const resolvedProviderId = toCleanString(adapter?.providerId) || providerId;

  const url = await adapter.createBillingPortalSession({
    billingAccountId,
    businessId,
    returnUrl,
    actorUserId: userId,
  });

  return {
    ok: true,
    provider: resolvedProviderId,
    billingAccountId,
    businessId,
    url,
  };
});

export const verifySubscriptionCheckoutSession = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  const orderNumber = toCleanString(request?.data?.orderNumber);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!orderNumber) {
    throw new HttpsError('invalid-argument', 'orderNumber es requerido');
  }

  const { userId } = await resolveAuthUser(request);
  await assertBillingAccessForBusiness({
    businessId,
    actorUserId: userId,
    allowRoles: ['owner', 'admin'],
  });

  await ensureBusinessBillingSetup({ businessId, actorUserId: userId });
  const { billingAccountId } = await resolveBillingAccountIdFromBusiness(businessId);
  const checkoutRef = db
    .doc(`billingAccounts/${billingAccountId}`)
    .collection(CHECKOUT_SESSIONS_SUBCOLLECTION)
    .doc(orderNumber);
  const checkoutSnap = await checkoutRef.get();

  if (!checkoutSnap.exists) {
    throw new HttpsError('not-found', 'Checkout session no encontrada');
  }

  const checkoutSession = checkoutSnap.data() || {};
  const checkoutBusinessId = toCleanString(checkoutSession.businessId);
  if (checkoutBusinessId && checkoutBusinessId !== businessId) {
    throw new HttpsError(
      'permission-denied',
      'La sesión no pertenece al negocio solicitado',
    );
  }

  const currentStatus = toCleanString(checkoutSession.status)?.toLowerCase() || 'pending';
  const currentPaymentId = toCleanString(checkoutSession.paymentId);
  const currentSubscriptionId = toCleanString(checkoutSession.subscriptionId);
  if (
    TERMINAL_CHECKOUT_STATUSES.has(currentStatus) &&
    (currentPaymentId || currentSubscriptionId)
  ) {
    return {
      ok: true,
      provider:
        toCleanString(checkoutSession.provider) || BILLING_DEFAULT_PROVIDER,
      orderNumber,
      status: currentStatus,
      approved: currentStatus === 'paid',
      paymentId: currentPaymentId,
      subscriptionId: currentSubscriptionId,
      message:
        toCleanString(asRecord(checkoutSession.verification).message) || null,
    };
  }

  const providerId =
    toCleanString(checkoutSession.provider) || BILLING_DEFAULT_PROVIDER;
  const adapter = resolvePaymentProviderAdapter(providerId);
  if (typeof adapter?.verifyCheckoutSession !== 'function') {
    throw new HttpsError(
      'unimplemented',
      `Proveedor ${providerId} no soporta verificación de checkout`,
    );
  }

  const verificationResult = await adapter.verifyCheckoutSession({
    billingAccountId,
    businessId,
    orderNumber,
    checkoutSession,
  });
  const verificationStatus =
    toCleanString(verificationResult?.status)?.toLowerCase() || 'pending';
  const verificationAmount =
    toFiniteNumber(verificationResult?.amount, null) ??
    toFiniteNumber(checkoutSession.amount, null);
  const verificationCurrency =
    toCleanString(verificationResult?.currency) ||
    toCleanString(checkoutSession.currency) ||
    'DOP';
  const verificationMessage =
    toCleanString(verificationResult?.message) ||
    (verificationStatus === 'paid'
      ? 'Pago verificado correctamente.'
      : verificationStatus === 'void'
        ? 'El pago fue cancelado por el usuario.'
        : verificationStatus === 'failed'
          ? 'El pago fue rechazado por la pasarela.'
          : 'El pago todavía está pendiente de confirmación.');

  let paymentId = currentPaymentId;
  if (
    TERMINAL_CHECKOUT_STATUSES.has(verificationStatus) &&
    verificationAmount != null &&
    verificationAmount > 0
  ) {
    paymentId = await writePaymentHistoryItem({
      billingAccountId,
      paymentId: currentPaymentId || orderNumber,
      amount: verificationAmount,
      currency: verificationCurrency,
      provider: providerId,
      status: verificationStatus,
      description:
        verificationStatus === 'paid'
          ? `Pago verificado vía ${providerId} (${orderNumber})`
          : `Intento no exitoso vía ${providerId} (${orderNumber})`,
      reference:
        toCleanString(verificationResult?.reference) ||
        toCleanString(verificationResult?.sessionId) ||
        orderNumber,
      source: `${providerId}_verify`,
      createdBy: `system:${providerId}:verify`,
      metadata: {
        orderNumber,
        gatewayStatus: toCleanString(verificationResult?.gatewayStatus),
        responseCode: toCleanString(verificationResult?.responseCode),
        message: verificationMessage,
        sessionId: toCleanString(verificationResult?.sessionId),
      },
    });
  }

  let subscriptionId = currentSubscriptionId;
  if (verificationStatus === 'paid' && !subscriptionId) {
    const assignmentResult = await assignSubscriptionToBillingAccount({
      billingAccountId,
      planCode: toCleanString(checkoutSession.planCode) || 'legacy',
      status: 'active',
      scope: 'account',
      provider: providerId,
      actorUserId: `system:${providerId}:verify`,
      note: `Pago verificado vía ${providerId} (Order: ${orderNumber})`,
    });
    subscriptionId = toCleanString(assignmentResult?.subscriptionId);
  }

  await checkoutRef.set(
    {
      status: verificationStatus,
      paymentId: paymentId || null,
      subscriptionId: subscriptionId || null,
      verifiedAt: FieldValue.serverTimestamp(),
      verifiedBy: userId,
      verification: {
        approved: verificationResult?.approved === true,
        amount: verificationAmount,
        currency: verificationCurrency,
        reference: toCleanString(verificationResult?.reference),
        sessionId: toCleanString(verificationResult?.sessionId),
        gatewayStatus: toCleanString(verificationResult?.gatewayStatus),
        responseCode: toCleanString(verificationResult?.responseCode),
        message: verificationMessage,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    ok: true,
    provider: providerId,
    orderNumber,
    status: verificationStatus,
    approved: verificationResult?.approved === true,
    paymentId: paymentId || null,
    subscriptionId: subscriptionId || null,
    message: verificationMessage,
  };
});

export const processMockSubscriptionScenario = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const { userId } = await resolveAuthUser(request);
  await assertBillingAccessForBusiness({
    businessId,
    actorUserId: userId,
    allowRoles: ['owner', 'admin'],
  });

  await ensureBusinessBillingSetup({ businessId, actorUserId: userId });
  const currentSubscription = await getBusinessSubscriptionSnapshot(businessId);
  const nextStatus = resolveMockSubscriptionStatus(request?.data?.nextStatus);
  const provider =
    toCleanString(request?.data?.provider) || BILLING_DEFAULT_PROVIDER;
  const scope = toCleanString(request?.data?.scope) || 'business';
  const targetBusinessId =
    scope === 'account'
      ? null
      : toCleanString(request?.data?.targetBusinessId) || businessId;
  const planCode =
    toCleanString(request?.data?.planCode) ||
    toCleanString(currentSubscription.planId) ||
    'legacy';
  const effectiveAt = request?.data?.effectiveAt || null;
  const note =
    toCleanString(request?.data?.note) ||
    `mock_flow:${nextStatus}:${new Date().toISOString()}`;

  const assignmentResult = await assignSubscriptionToBillingAccount({
    billingAccountId: (await resolveBillingAccountIdFromBusiness(businessId))
      .billingAccountId,
    planCode,
    status: nextStatus,
    scope,
    targetBusinessId,
    effectiveAt,
    provider,
    actorUserId: userId,
    note,
  });

  const parsedPaymentAmount = Number(request?.data?.paymentAmount);
  const defaultAmount =
    Number(currentSubscription.raw?.priceMonthly) ||
    Number(assignmentResult.subscription?.priceMonthly) ||
    0;
  const paymentAmount = Number.isFinite(parsedPaymentAmount)
    ? parsedPaymentAmount
    : defaultAmount;
  const recordPayment =
    request?.data?.recordPayment === true || paymentAmount > 0;

  let paymentId = null;
  if (recordPayment && paymentAmount > 0) {
    const paymentStatus =
      toCleanString(request?.data?.paymentStatus) ||
      DEFAULT_PAYMENT_STATUS_BY_SUBSCRIPTION_STATUS[nextStatus] ||
      'paid';
    paymentId = await writePaymentHistoryItem({
      billingAccountId: assignmentResult.billingAccountId,
      amount: paymentAmount,
      currency: toCleanString(request?.data?.paymentCurrency) || 'DOP',
      provider,
      status: paymentStatus,
      description:
        toCleanString(request?.data?.paymentDescription) ||
        `mock_payment:${nextStatus}`,
      reference: toCleanString(request?.data?.paymentReference),
      source: 'billing_mock_flow',
      createdBy: userId,
    });
  }

  const updatedSubscription = await getBusinessSubscriptionSnapshot(businessId);

  return {
    ok: true,
    businessId,
    billingAccountId: assignmentResult.billingAccountId,
    subscriptionId: assignmentResult.subscriptionId,
    scope: assignmentResult.scope,
    targetBusinessId: assignmentResult.targetBusinessId || businessId,
    previousStatus: toCleanString(currentSubscription.status),
    nextStatus,
    activeSubscription: updatedSubscription.raw,
    paymentId,
  };
});

export const devListBillingAccounts = onCall(async (request) => {
  const limit = Number(request?.data?.limit || 50);
  const { userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const accounts = await listBillingAccounts({ limit });
  return {
    ok: true,
    accounts,
  };
});

export const devListPlanCatalog = onCall(async (request) => {
  const { userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const plans = await listPlanCatalog();
  return {
    ok: true,
    plans,
  };
});

export const devUpsertPlanCatalogDefinition = onCall(async (request) => {
  const { userId, userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const planCode = toCleanString(request?.data?.planCode);
  const payload = asRecord(request?.data?.payload);

  const result = await upsertPlanCatalogDefinition({
    planCode,
    payload,
    actorUserId: userId,
  });

  return {
    ok: true,
    ...result,
  };
});

export const devUpsertPlanCatalogVersion = onCall(async (request) => {
  const { userId, userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const planCode = toCleanString(request?.data?.planCode);
  const versionId = toCleanString(request?.data?.versionId);
  const payload = asRecord(request?.data?.payload);

  const result = await upsertPlanCatalogVersion({
    planCode,
    versionId,
    payload,
    actorUserId: userId,
  });

  return {
    ok: true,
    ...result,
  };
});

export const devPublishPlanCatalogVersion = onCall(
  { secrets: MAIL_SECRETS, timeoutSeconds: 60 },
  async (request) => {
    const { userId, userData } = await resolveAuthUser(request);
    assertDeveloperAccess(userData);

    const planCode = toCleanString(request?.data?.planCode);
    const versionId = toCleanString(request?.data?.versionId);
    const effectiveAt = request?.data?.effectiveAt || null;
    const noticeWindowDays = request?.data?.noticeWindowDays;
    const plansBeforePublish = await listPlanCatalog();
    const previousPlanEntry =
      plansBeforePublish.find((item) => toCleanString(item.planCode) === planCode) || {};
    const previousVersion = asRecord(previousPlanEntry.currentVersion);

    const result = await publishPlanCatalogVersion({
      planCode,
      versionId,
      effectiveAt,
      noticeWindowDays,
      actorUserId: userId,
    });

    if (result.state === 'active') {
      await refreshSubscriptionsForPlanCode({
        planCode: result.planCode,
        actorUserId: userId,
        atMillis: result.effectiveAt,
      });
    }

    const plans = await listPlanCatalog();
    const planEntry =
      plans.find((item) => toCleanString(item.planCode) === result.planCode) || {};
    const displayName =
      toCleanString(planEntry.displayName) || toCleanString(result.planCode);
    const nextVersion =
      (Array.isArray(planEntry.versions)
        ? planEntry.versions.find(
          (item) =>
            toCleanString(item?.versionId) === result.versionId ||
            toCleanString(item?.version) === result.versionId,
        )
        : null) ||
      planEntry.currentVersion ||
      {};
    const noNotice = result.noticeWindowDays === 0;
    const notifications = noNotice
      ? { recipientCount: 0, delivered: 0, skipped: 0, failed: 0 }
      : await sendPlanVersionNoticeEmails({
          planCode: result.planCode,
          versionId: result.versionId,
          displayName,
          effectiveAt: result.effectiveAt,
          noticeWindowDays: result.noticeWindowDays,
          previousVersion,
          nextVersion,
        });

    if (!noNotice) {
      await db
        .doc(`billingPlanCatalog/${result.planCode}/versions/${result.versionId}`)
        .set(
          {
            noticeEmailLastSentAt: FieldValue.serverTimestamp(),
            noticeEmailRecipientCount: notifications.recipientCount,
            noticeEmailDelivered: notifications.delivered,
            noticeEmailSkipped: notifications.skipped,
            noticeEmailFailed: notifications.failed,
          },
          { merge: true },
        );
    }

    return {
      ok: true,
      ...result,
      notifications,
    };
  },
);

export const devUpdatePlanCatalogLifecycle = onCall(async (request) => {
  const { userId, userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const planCode = toCleanString(request?.data?.planCode);
  const versionId = toCleanString(request?.data?.versionId);
  const lifecycleStatus = toCleanString(request?.data?.lifecycleStatus);

  const result = await updatePlanCatalogLifecycle({
    planCode,
    versionId,
    lifecycleStatus,
    actorUserId: userId,
  });

  return {
    ok: true,
    ...result,
  };
});

export const devDeletePlanCatalogDefinition = onCall(async (request) => {
  const { userId, userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const planCode = toCleanString(request?.data?.planCode);
  const result = await deletePlanCatalogDefinition({
    planCode,
    actorUserId: userId,
  });

  return {
    ok: true,
    ...result,
  };
});

export const devPreviewPlanCatalogImpact = onCall(async (request) => {
  const { userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const planCode = toCleanString(request?.data?.planCode);
  const payload = asRecord(request?.data?.payload);
  const result = await previewPlanCatalogImpact({
    planCode,
    payload,
  });

  return {
    ok: true,
    ...result,
  };
});

export const devAssignSubscription = onCall(async (request) => {
  const { userId, userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const billingAccountId = toCleanString(request?.data?.billingAccountId);
  const planCode = toCleanString(request?.data?.planCode);
  const scope = toCleanString(request?.data?.scope) || 'account';
  const targetBusinessId = toCleanString(request?.data?.targetBusinessId);
  const provider = toCleanString(request?.data?.provider) || BILLING_DEFAULT_PROVIDER;
  const status = toCleanString(request?.data?.status) || 'active';
  const effectiveAt = request?.data?.effectiveAt || null;
  const note = toCleanString(request?.data?.note);

  const result = await assignSubscriptionToBillingAccount({
    billingAccountId,
    planCode,
    scope,
    targetBusinessId,
    provider,
    status,
    effectiveAt,
    actorUserId: userId,
    note,
  });

  return {
    ok: true,
    ...result,
  };
});

export const devRecordPaymentHistoryItem = onCall(async (request) => {
  const { userId, userData } = await resolveAuthUser(request);
  assertDeveloperAccess(userData);

  const billingAccountId = toCleanString(request?.data?.billingAccountId);
  if (!billingAccountId) {
    throw new HttpsError('invalid-argument', 'billingAccountId es requerido');
  }

  const amount = Number(request?.data?.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError('invalid-argument', 'amount debe ser mayor que cero');
  }

  const currency = toCleanString(request?.data?.currency) || 'DOP';
  const provider = toCleanString(request?.data?.provider) || 'manual';
  const status = toCleanString(request?.data?.status) || 'paid';
  const description = toCleanString(request?.data?.description) || null;
  const reference = toCleanString(request?.data?.reference) || null;

  const paymentRef = db
    .doc(`billingAccounts/${billingAccountId}`)
    .collection(PAYMENT_HISTORY_SUBCOLLECTION)
    .doc();

  await paymentRef.set(
    {
      paymentId: paymentRef.id,
      amount,
      currency,
      provider,
      status,
      description,
      reference,
      source: 'developer_panel',
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    ok: true,
    paymentId: paymentRef.id,
  };
});







