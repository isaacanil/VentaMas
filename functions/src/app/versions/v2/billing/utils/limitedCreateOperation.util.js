import { HttpsError } from 'firebase-functions/v2/https';

import { resolveCallableAuthUid } from '../../../../core/utils/callableSessionAuth.util.js';
import { resolveSubscriptionOperationAccess } from '../config/limitOperations.config.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../auth/services/userAccess.service.js';
import { asRecord, toCleanString } from './billingCommon.util.js';
import { assertBusinessSubscriptionAccess } from './subscriptionAccess.util.js';

const DEFAULT_ALLOWED_ROLES = MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR;

const resolveBusinessId = ({ payload, input, inputBusinessIdKeys = [] }) => {
  const candidates = [
    payload.businessId,
    payload.businessID,
    ...inputBusinessIdKeys.map((key) => input[key]),
  ];

  for (const candidate of candidates) {
    const businessId = toCleanString(candidate);
    if (businessId) return businessId;
  }
  return null;
};

const normalizeInputKey = (inputKey) => {
  const normalizedInputKey = toCleanString(inputKey);
  if (!normalizedInputKey) {
    throw new HttpsError('invalid-argument', 'inputKey es requerido');
  }
  return normalizedInputKey;
};

const resolveOperationUsageDelta = (operation) => {
  const operationAccess = resolveSubscriptionOperationAccess(operation) || {};
  const incrementBy = Number(operationAccess.incrementBy ?? 1);

  return {
    operationAccess,
    metricKey: operationAccess.metricKey || null,
    incrementBy: Number.isFinite(incrementBy) ? incrementBy : 1,
  };
};

export const prepareLimitedCreateOperation = async ({
  request,
  inputKey,
  operation,
  inputBusinessIdKeys = [],
  allowedRoles = DEFAULT_ALLOWED_ROLES,
}) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const normalizedInputKey = normalizeInputKey(inputKey);
  const payload = asRecord(request?.data);
  const input = asRecord(payload[normalizedInputKey]);
  const businessId = resolveBusinessId({
    payload,
    input,
    inputBusinessIdKeys,
  });

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!Object.keys(input).length) {
    throw new HttpsError(
      'invalid-argument',
      `${normalizedInputKey} es requerido`,
    );
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles,
  });

  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation,
  });

  const { operationAccess, metricKey, incrementBy } =
    resolveOperationUsageDelta(operation);

  return {
    authUid,
    payload,
    input,
    businessId,
    metricKey,
    incrementBy,
    operationAccess,
  };
};
