import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { ensureDefaultWarehouse } from '../../../versions/v1/modules/warehouse/services/warehouse.service.js';
import {
  ensureBillingAccountForOwner,
} from '../../../versions/v2/billing/services/billingAccount.service.js';
import {
  LIMIT_OPERATION_KEYS,
  resolveSubscriptionOperationAccess,
} from '../../../versions/v2/billing/config/limitOperations.config.js';
import {
  ensureBusinessBillingSetup,
  getActiveSubscriptionForBillingAccount,
} from '../../../versions/v2/billing/services/subscriptionSnapshot.service.js';
import { assertUsageCanIncrease } from '../../../versions/v2/billing/services/usage.service.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const DEFAULT_BILLING_SETTINGS = {
  billingMode: 'direct',
  invoiceType: 'template1',
  authorizationFlowEnabled: false,
  enabledAuthorizationModules: {
    invoices: true,
    accountsReceivable: true,
    cashRegister: true,
  },
  stockAlertsEnabled: false,
  stockLowThreshold: 20,
  stockCriticalThreshold: 10,
  stockAlertEmail: '',
  isLoading: false,
  isError: null,
};

const DEFAULT_TAX_RECEIPTS = [
  {
    name: 'CONSUMIDOR FINAL',
    type: 'B',
    serie: '02',
    sequence: '0000000000',
    increase: 1,
    quantity: 2000,
  },
  {
    name: 'CREDITO FISCAL',
    type: 'B',
    serie: '01',
    sequence: '0000000000',
    increase: 1,
    quantity: 2000,
  },
];

const DEFAULT_FISCAL_FEATURES = Object.freeze({
  domainV2Enabled: false,
  sequenceEngineV2Enabled: false,
  reportingEnabled: false,
  monthlyComplianceEnabled: false,
  electronicModelEnabled: false,
  electronicTransportEnabled: false,
  taxationEnabled: true,
});

const STRICT_LIMIT_PLANS = new Set(['demo', 'plus']);

const readMaxBusinessesLimit = (subscription) => {
  const limits = subscription?.limits && typeof subscription.limits === 'object'
    ? subscription.limits
    : {};
  const direct = Number(limits.maxBusinesses);
  if (Number.isFinite(direct)) return direct;
  return null;
};

export const assertBusinessCreationLimit = async ({ ownerUid }) => {
  const normalizedOwnerUid = toCleanString(ownerUid);
  if (!normalizedOwnerUid) return;

  const { billingAccountId } = await ensureBillingAccountForOwner({
    ownerUid: normalizedOwnerUid,
    actorUserId: normalizedOwnerUid,
  });
  const activeSubscription = await getActiveSubscriptionForBillingAccount(
    billingAccountId,
  );

  const planId =
    toCleanString(activeSubscription?.planId)?.toLowerCase() || 'legacy';
  if (!STRICT_LIMIT_PLANS.has(planId)) {
    return;
  }

  const maxBusinesses = readMaxBusinessesLimit(activeSubscription);
  if (maxBusinesses == null || maxBusinesses < 0) {
    return;
  }

  const operationAccess = resolveSubscriptionOperationAccess(
    LIMIT_OPERATION_KEYS.BUSINESS_CREATE,
  );
  const linksSnap = await db
    .doc(`billingAccounts/${billingAccountId}`)
    .collection('businessLinks')
    .get();
  const currentBusinesses = linksSnap.size;
  try {
    assertUsageCanIncrease({
      subscription: activeSubscription,
      metricKey: operationAccess?.metricKey || 'businessesTotal',
      currentValue: currentBusinesses,
      incrementBy: operationAccess?.incrementBy || 1,
      planId,
    });
  } catch (error) {
    logger.warn('[createBusiness] blocked by maxBusinesses limit', {
      ownerUid: normalizedOwnerUid,
      billingAccountId,
      planId,
      currentBusinesses,
      maxBusinesses,
    });
    if (error instanceof HttpsError && error.code === 'resource-exhausted') {
      throw new HttpsError(
        'resource-exhausted',
        `Has agotado el máximo de negocios (${maxBusinesses}) para tu plan actual. Actualiza tu plan para crear más negocios.`,
      );
    }
    throw error;
  }
};

export const provisionBusinessCoreInTransaction = async ({
  tx,
  businessId,
  business,
  createdBy = null,
  requireNewBusiness = false,
}) => {
  if (!tx || !businessId || !business || typeof business !== 'object') {
    throw new HttpsError(
      'invalid-argument',
      'Parámetros inválidos para provisionar negocio',
    );
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const billingRef = db.doc(`businesses/${businessId}/settings/billing`);
  const taxReceiptSettingsRef = db.doc(
    `businesses/${businessId}/settings/taxReceipt`,
  );
  const taxReceiptsCol = db.collection(`businesses/${businessId}/taxReceipts`);

  // Firestore transactions require all reads to happen before any writes.
  const businessSnap = await tx.get(businessRef);
  const billingSnap = await tx.get(billingRef);
  const taxReceiptSettingsSnap = await tx.get(taxReceiptSettingsRef);

  const receiptRefs = DEFAULT_TAX_RECEIPTS.map((r) =>
    taxReceiptsCol.doc(r.serie),
  );
  const receiptSnaps = [];
  for (const receiptRef of receiptRefs) {
    receiptSnaps.push(await tx.get(receiptRef));
  }

  if (requireNewBusiness && businessSnap.exists) {
    throw new HttpsError(
      'already-exists',
      'Ya existe un negocio con ese identificador.',
    );
  }

  if (!businessSnap.exists) {
    const businessFeatures =
      business?.features && typeof business.features === 'object'
        ? business.features
        : {};
    const fiscalFeatures =
      businessFeatures?.fiscal && typeof businessFeatures.fiscal === 'object'
        ? businessFeatures.fiscal
        : {};
    const ownerFields = createdBy
      ? {
          ownerUid: createdBy,
          owners: [createdBy],
          billingContact: createdBy,
          billingContactUid: createdBy,
        }
      : {};
    tx.set(businessRef, {
      ...ownerFields,
      business: {
        ...business,
        features: {
          ...businessFeatures,
          fiscal: {
            ...DEFAULT_FISCAL_FEATURES,
            ...fiscalFeatures,
          },
        },
        id: businessId,
        ...ownerFields,
        createdAt: FieldValue.serverTimestamp(),
        createdBy,
      },
    });
  }

  if (!billingSnap.exists) {
    tx.set(billingRef, DEFAULT_BILLING_SETTINGS);
  }

  if (!taxReceiptSettingsSnap.exists) {
    tx.set(taxReceiptSettingsRef, { taxReceiptEnabled: false });
  }

  receiptSnaps.forEach((receiptSnap, idx) => {
    if (receiptSnap.exists) return;

    const receipt = DEFAULT_TAX_RECEIPTS[idx];
    const receiptRef = receiptRefs[idx];

    tx.set(receiptRef, {
      data: {
        ...receipt,
        id: receipt.serie,
        createdAt: FieldValue.serverTimestamp(),
      },
    });
  });

  return { businessRef };
};

export const runBusinessPostProvisioning = async ({
  businessId,
  actorUserId,
}) => {
  try {
    await ensureBusinessBillingSetup({
      businessId,
      actorUserId,
    });
  } catch (error) {
    logger.error('[createBusiness] billing setup failed', {
      businessId,
      error,
    });
  }

  try {
    await ensureDefaultWarehouse({
      businessID: businessId,
      uid: actorUserId,
    });
  } catch (error) {
    logger.error('[createBusiness] default warehouse failed', {
      businessId,
      error,
    });
  }
};

export const createBusiness = onCall(async (req) => {
  const payload = req.data || {};
  const business = payload.business || null;
  const actor = payload.user || {};

  if (!req.auth?.uid && !actor?.uid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  if (!business || typeof business !== 'object') {
    throw new HttpsError('invalid-argument', 'business requerido');
  }

  const businessId =
    typeof business.id === 'string' && business.id.trim()
      ? business.id.trim()
      : nanoid();
  const createdBy = req.auth?.uid || actor?.uid || null;

  if (createdBy) {
    await assertBusinessCreationLimit({ ownerUid: createdBy });
  }

  await db.runTransaction(async (tx) => {
    await provisionBusinessCoreInTransaction({
      tx,
      businessId,
      business,
      createdBy,
    });
  });

  await runBusinessPostProvisioning({ businessId, actorUserId: createdBy });

  return { ok: true, id: businessId };
});
