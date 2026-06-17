import { onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { getNextIDTransactional } from '../../../core/utils/getNextID.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import { prepareLimitedCreateOperation } from '../../../versions/v2/billing/utils/limitedCreateOperation.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSerializableWarehouse = (warehouse) => {
  if (!warehouse || typeof warehouse !== 'object') return null;
  const next = { ...warehouse };
  delete next.createdAt;
  delete next.updatedAt;
  return next;
};

export const createWarehouse = onCall(async (request) => {
  const {
    authUid,
    businessId,
    input: warehouseInput,
    metricKey,
    incrementBy,
  } = await prepareLimitedCreateOperation({
    request,
    inputKey: 'warehouse',
    operation: LIMIT_OPERATION_KEYS.WAREHOUSE_CREATE,
  });

  const user = { uid: authUid, businessID: businessId };
  const warehouseId = toCleanString(warehouseInput.id) || nanoid();
  let createdWarehouse = null;

  await db.runTransaction(async (transaction) => {
    const number = await getNextIDTransactional(
      transaction,
      user,
      'lastWarehouseId',
      1,
    );

    createdWarehouse = {
      ...warehouseInput,
      id: warehouseId,
      number,
      owner: toCleanString(warehouseInput.owner) || authUid,
      location: toCleanString(warehouseInput.location) || '',
      address: toCleanString(warehouseInput.address) || '',
      name: toCleanString(warehouseInput.name) || '',
      shortName: toCleanString(warehouseInput.shortName) || '',
      description: toCleanString(warehouseInput.description) || '',
      dimension: {
        length: sanitizeNumber(asRecord(warehouseInput.dimension).length, 0),
        width: sanitizeNumber(asRecord(warehouseInput.dimension).width, 0),
        height: sanitizeNumber(asRecord(warehouseInput.dimension).height, 0),
      },
      capacity: sanitizeNumber(warehouseInput.capacity, 0),
      defaultWarehouse: warehouseInput.defaultWarehouse === true,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: authUid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: authUid,
    };

    const warehouseRef = db.doc(
      `businesses/${businessId}/warehouses/${warehouseId}`,
    );
    transaction.set(warehouseRef, createdWarehouse);

    await incrementBusinessUsageMetric({
      businessId,
      metricKey,
      incrementBy,
      tx: transaction,
    });
  });

  return {
    ok: true,
    businessId,
    warehouseId,
    warehouse: toSerializableWarehouse(createdWarehouse),
  };
});
