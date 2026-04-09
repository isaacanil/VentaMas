import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import {
  assertBusinessSubscriptionAccess,
} from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readString = (value) => {
  const normalized = toCleanString(value);
  return normalized || '';
};

const buildProviderPayload = (providerInput, providerId) => ({
  id: providerId,
  rnc: readString(providerInput.rnc),
  name: readString(providerInput.name),
  voucherType: readString(providerInput.voucherType),
  email: readString(providerInput.email),
  tel: readString(providerInput.tel),
  address: readString(providerInput.address),
  notes: readString(providerInput.notes),
  country: readString(providerInput.country),
  status: 'active',
});

const hasDuplicateProvider = async ({
  businessId,
  providerId = null,
  rnc,
  name,
}) => {
  const providersCol = db.collection(`businesses/${businessId}/providers`);
  const duplicates = { rnc: false, name: false };

  const checks = [];
  if (rnc) {
    checks.push(
      providersCol.where('provider.rnc', '==', rnc).limit(5).get().then((snap) => {
        duplicates.rnc = snap.docs.some((docSnap) => docSnap.id !== providerId);
      }),
    );
  }
  if (name) {
    checks.push(
      providersCol.where('provider.name', '==', name).limit(5).get().then((snap) => {
        duplicates.name = snap.docs.some((docSnap) => docSnap.id !== providerId);
      }),
    );
  }

  await Promise.all(checks);
  return duplicates;
};

export const createProvider = onCall(async (request) => {
  try {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const providerInput = asRecord(payload.provider);
    const businessId =
      toCleanString(payload.businessId) ||
      toCleanString(payload.businessID) ||
      null;

    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!Object.keys(providerInput).length) {
      throw new HttpsError('invalid-argument', 'provider es requerido');
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });

    await assertBusinessSubscriptionAccess({
      businessId,
      action: 'write',
      operation: LIMIT_OPERATION_KEYS.SUPPLIER_CREATE,
    });

    const providerId = toCleanString(providerInput.id) || nanoid(10);
    const normalizedProvider = buildProviderPayload(providerInput, providerId);

    const duplicates = await hasDuplicateProvider({
      businessId,
      providerId,
      rnc: normalizedProvider.rnc || null,
      name: normalizedProvider.name || null,
    });
    if (duplicates.rnc || duplicates.name) {
      const reason = [];
      if (duplicates.rnc) reason.push('Ya existe un proveedor con este RNC');
      if (duplicates.name) reason.push('Ya existe un proveedor con este nombre');
      throw new HttpsError('already-exists', reason.join('. '));
    }

    await db.runTransaction(async (transaction) => {
      const providerRef = db.doc(
        `businesses/${businessId}/providers/${providerId}`,
      );
      transaction.set(providerRef, {
        provider: {
          ...normalizedProvider,
          createdAt: FieldValue.serverTimestamp(),
        },
      });

      await incrementBusinessUsageMetric({
        businessId,
        metricKey: 'suppliersTotal',
        incrementBy: 1,
        tx: transaction,
      });
    });

    return {
      ok: true,
      businessId,
      providerId,
      provider: normalizedProvider,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('createProvider failed unexpectedly', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      data: request?.data || null,
    });
    throw new HttpsError(
      'internal',
      'No se pudo crear el proveedor en este momento.',
    );
  }
});
