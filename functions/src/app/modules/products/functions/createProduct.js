import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  getNextIDTransactional,
} from '../../../core/utils/getNextID.js';
import {
  getDefaultWarehouse,
} from '../../../versions/v1/modules/warehouse/services/warehouse.service.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const buildBaseAuditFields = (userId) => ({
  createdAt: FieldValue.serverTimestamp(),
  createdBy: userId,
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: userId,
  deletedAt: null,
  deletedBy: null,
  isDeleted: false,
});

const buildCreateProductPayload = (rawProduct, businessId) => {
  const product = {
    ...asRecord(rawProduct),
    id: nanoid(10),
    businessID: businessId,
  };

  product.stock = sanitizeNumber(product.stock, 0);
  return product;
};

export const createProduct = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const productInput = asRecord(payload.product);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    toCleanString(productInput.businessID) ||
    null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  if (!Object.keys(productInput).length) {
    throw new HttpsError('invalid-argument', 'product es requerido');
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.PRODUCT_CREATE,
  });

  const user = { uid: authUid, businessID: businessId };
  const defaultWarehouse = await getDefaultWarehouse(user);
  if (!defaultWarehouse?.id) {
    throw new HttpsError(
      'failed-precondition',
      'No se pudo obtener almacén predeterminado',
    );
  }

  const product = buildCreateProductPayload(productInput, businessId);
  const baseFields = buildBaseAuditFields(authUid);

  await db.runTransaction(async (transaction) => {
    const batchNumber = await getNextIDTransactional(
      transaction,
      user,
      'batches',
      1,
    );
    if (!batchNumber) {
      throw new HttpsError(
        'internal',
        'Error al generar número de lote',
      );
    }

    const productRef = db.doc(`businesses/${businessId}/products/${product.id}`);
    transaction.set(productRef, product);

    const batch = {
      ...baseFields,
      id: nanoid(10),
      productId: product.id,
      productName: product.name || null,
      numberId: batchNumber,
      status: 'active',
      receivedDate: FieldValue.serverTimestamp(),
      providerId: null,
      quantity: product.stock,
      initialQuantity: product.stock,
    };
    const batchRef = db.doc(`businesses/${businessId}/batches/${batch.id}`);
    transaction.set(batchRef, batch);

    const stock = {
      ...baseFields,
      id: nanoid(10),
      batchId: batch.id,
      productName: product.name || null,
      batchNumberId: batchNumber,
      location: defaultWarehouse.id,
      expirationDate: null,
      status: 'active',
      productId: product.id,
      quantity: product.stock,
      initialQuantity: product.stock,
    };
    const stockRef = db.doc(`businesses/${businessId}/productsStock/${stock.id}`);
    transaction.set(stockRef, stock);

    const movement = {
      ...baseFields,
      id: nanoid(10),
      batchId: batch.id,
      productName: product.name || null,
      batchNumberId: batchNumber,
      destinationLocation: defaultWarehouse.id,
      sourceLocation: null,
      productId: product.id,
      quantity: product.stock,
      movementType: 'in',
      movementReason: 'initial_stock',
    };
    const movementRef = db.doc(`businesses/${businessId}/movements/${movement.id}`);
    transaction.set(movementRef, movement);

    await incrementBusinessUsageMetric({
      businessId,
      metricKey: 'productsTotal',
      incrementBy: 1,
      tx: transaction,
    });
  });

  return {
    ok: true,
    productId: product.id,
    businessId,
  };
});
