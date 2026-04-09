import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import { toCleanString, toFiniteNumber } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'dev']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const roundToTwoDecimals = (value) =>
  Math.round(toFiniteNumber(value, 0) * 100) / 100;

const toUserRef = (userId) => {
  const normalized = toCleanString(userId);
  return normalized ? db.doc(`users/${normalized}`) : null;
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

export const buildCashOverShortAccountingEvent = ({
  businessId,
  cashCountId,
  cashCount,
  accountingSettings,
  authUid,
  occurredAt,
}) => {
  const discrepancyAmount = roundToTwoDecimals(cashCount?.totalDiscrepancy);
  if (Math.abs(discrepancyAmount) <= 0.01) {
    return null;
  }

  const eventTimestamp =
    occurredAt != null ? Timestamp.fromMillis(occurredAt) : Timestamp.now();
  const functionalCurrency =
    toCleanString(accountingSettings?.functionalCurrency) || null;

  return buildAccountingEvent({
    businessId,
    eventType: 'cash_over_short.recorded',
    sourceType: 'cashCount',
    sourceId: cashCountId,
    sourceDocumentType: 'cashCount',
    sourceDocumentId: cashCountId,
    currency: functionalCurrency,
    functionalCurrency,
    monetary: {
      amount: discrepancyAmount,
      functionalAmount: discrepancyAmount,
    },
    treasury: {
      cashCountId,
      paymentChannel: 'cash',
    },
    payload: {
      discrepancyAmount,
      discrepancyDirection: discrepancyAmount > 0 ? 'over' : 'short',
      totalSystem: roundToTwoDecimals(cashCount?.totalSystem),
      totalRegister: roundToTwoDecimals(cashCount?.totalRegister),
      totalCard: roundToTwoDecimals(cashCount?.totalCard),
      totalTransfer: roundToTwoDecimals(cashCount?.totalTransfer),
      totalCharged: roundToTwoDecimals(cashCount?.totalCharged),
      totalReceivables: roundToTwoDecimals(cashCount?.totalReceivables),
    },
    occurredAt: eventTimestamp,
    recordedAt: eventTimestamp,
    createdAt: eventTimestamp,
    createdBy: authUid,
  });
};

export const closeCashCount = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const cashCountInput = asRecord(payload.cashCount);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const cashCountId =
    toCleanString(payload.cashCountId) ||
    toCleanString(cashCountInput.id) ||
    null;
  const employeeId =
    toCleanString(payload.employeeID) ||
    toCleanString(payload.employeeId) ||
    authUid;
  const approvalEmployeeId =
    toCleanString(payload.approvalEmployeeID) ||
    toCleanString(payload.approvalEmployeeId) ||
    null;
  const clientBuildId = toCleanString(payload.clientBuildId) || null;
  const clientAppVersion = toCleanString(payload.clientAppVersion) || null;

  if (!businessId || !cashCountId || !approvalEmployeeId) {
    throw new HttpsError(
      'invalid-argument',
      'businessId, cashCountId y approvalEmployeeID son requeridos',
    );
  }

  let resolvedCurrentState = null;
  let resolvedOpeningEmployeeId = null;
  let resolvedActorRole = null;
  let resolvedCanManage = null;
  let resolvedMembershipRole = null;
  let resolvedMembershipSource = null;
  let resolvedClosingMillis = null;

  logger.info('[closeCashCount] request received', {
    authUid,
    businessId,
    cashCountId,
    employeeId,
    approvalEmployeeId,
    clientBuildId,
    clientAppVersion,
    hasClosingPayload: Boolean(cashCountInput.closing),
  });

  try {
    const membership = await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });

    resolvedMembershipRole = membership?.role || null;
    resolvedMembershipSource = membership?.source || null;
    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);

    logger.info('[closeCashCount] membership resolved', {
      authUid,
      businessId,
      cashCountId,
      membershipRole: resolvedMembershipRole,
      membershipSource: resolvedMembershipSource,
      clientBuildId,
      clientAppVersion,
    });

    const cashCountRef = db.doc(`businesses/${businessId}/cashCounts/${cashCountId}`);
    let shouldDecrementOpenCashRegisters = false;
    let responsePayload = {
      ok: true,
      businessId,
      cashCountId,
      state: 'closed',
    };
    await db.runTransaction(async (transaction) => {
      const cashCountSnap = await transaction.get(cashCountRef);
      if (!cashCountSnap.exists) {
        throw new HttpsError('not-found', 'Cuadre de caja no encontrado');
      }

      resolvedCurrentState =
        toCleanString(cashCountSnap.get('cashCount.state')) || 'open';
      resolvedOpeningEmployeeId = resolveEmployeeId(
        cashCountSnap.get('cashCount.opening.employee'),
      );
      resolvedActorRole = toCleanString(membership?.role)?.toLowerCase() || '';
      resolvedCanManage =
        resolvedOpeningEmployeeId === authUid ||
        MANAGER_ROLES.has(resolvedActorRole);
      shouldDecrementOpenCashRegisters = resolvedCurrentState !== 'closed';

      logger.info('[closeCashCount] cash count loaded', {
        authUid,
        businessId,
        cashCountId,
        currentState: resolvedCurrentState,
        openingEmployeeId: resolvedOpeningEmployeeId,
        actorRole: resolvedActorRole,
        canManage: resolvedCanManage,
        clientBuildId,
        clientAppVersion,
      });

      if (!resolvedCanManage) {
        throw new HttpsError(
          'permission-denied',
          'No autorizado para cerrar el cuadre',
        );
      }

      if (resolvedCurrentState === 'closed') {
        responsePayload = {
          ok: true,
          businessId,
          cashCountId,
          state: 'closed',
          alreadyClosed: true,
          reused: true,
        };

        logger.info('[closeCashCount] already closed, skipping mutation', {
          authUid,
          businessId,
          cashCountId,
          currentState: resolvedCurrentState,
          clientBuildId,
          clientAppVersion,
        });
        return;
      }

      const closingMillis = toMillis(payload.closingDate) ?? Date.now();
      resolvedClosingMillis = closingMillis;
      transaction.update(cashCountRef, {
        'cashCount.state': 'closed',
        'cashCount.updatedAt': Timestamp.fromMillis(Date.now()),
        'cashCount.closing': {
          ...asRecord(cashCountInput.closing),
          employee: toUserRef(employeeId),
          approvalEmployee: toUserRef(approvalEmployeeId),
          initialized: true,
          date: Timestamp.fromMillis(closingMillis),
        },
        'cashCount.totalCard': toFiniteNumber(cashCountInput.totalCard, 0),
        'cashCount.totalTransfer': toFiniteNumber(
          cashCountInput.totalTransfer,
          0,
        ),
        'cashCount.totalCharged': toFiniteNumber(cashCountInput.totalCharged, 0),
        'cashCount.totalReceivables': toFiniteNumber(
          cashCountInput.totalReceivables,
          0,
        ),
        'cashCount.totalDiscrepancy': toFiniteNumber(
          cashCountInput.totalDiscrepancy,
          0,
        ),
        'cashCount.totalRegister': toFiniteNumber(
          cashCountInput.totalRegister,
          0,
        ),
        'cashCount.totalSystem': toFiniteNumber(cashCountInput.totalSystem, 0),
        'cashCount.stateHistory': FieldValue.arrayUnion({
          state: 'closed',
          timestamp: Timestamp.fromMillis(Date.now()),
          updatedBy: authUid,
        }),
      });
    });

    logger.info('[closeCashCount] transaction committed', {
      authUid,
      businessId,
      cashCountId,
      shouldDecrementOpenCashRegisters,
      currentState: resolvedCurrentState,
      openingEmployeeId: resolvedOpeningEmployeeId,
      canManage: resolvedCanManage,
      clientBuildId,
      clientAppVersion,
    });

    if (shouldDecrementOpenCashRegisters) {
      await incrementBusinessUsageMetric({
        businessId,
        metricKey: 'openCashRegisters',
        incrementBy: -1,
      });

      logger.info('[closeCashCount] usage metric decremented', {
        businessId,
        cashCountId,
        metricKey: 'openCashRegisters',
        clientBuildId,
        clientAppVersion,
      });
    }

    if (
      responsePayload.alreadyClosed !== true &&
      isAccountingRolloutEnabledForBusiness(businessId, accountingSettings) &&
      accountingSettings?.generalAccountingEnabled === true
    ) {
      const accountingEvent = buildCashOverShortAccountingEvent({
        businessId,
        cashCountId,
        cashCount: {
          totalDiscrepancy: cashCountInput.totalDiscrepancy,
          totalSystem: cashCountInput.totalSystem,
          totalRegister: cashCountInput.totalRegister,
          totalCard: cashCountInput.totalCard,
          totalTransfer: cashCountInput.totalTransfer,
          totalCharged: cashCountInput.totalCharged,
          totalReceivables: cashCountInput.totalReceivables,
        },
        accountingSettings,
        authUid,
        occurredAt: resolvedClosingMillis,
      });

      if (accountingEvent) {
        await db
          .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
          .set(accountingEvent, { merge: true });
      }
    }

    logger.info('[closeCashCount] completed', {
      authUid,
      businessId,
      cashCountId,
      state: responsePayload.state,
      alreadyClosed: responsePayload.alreadyClosed === true,
      clientBuildId,
      clientAppVersion,
    });

    return responsePayload;
  } catch (error) {
    logger.error('[closeCashCount] failed', {
      authUid,
      businessId,
      cashCountId,
      employeeId,
      approvalEmployeeId,
      clientBuildId,
      clientAppVersion,
      membershipRole: resolvedMembershipRole,
      membershipSource: resolvedMembershipSource,
      currentState: resolvedCurrentState,
      openingEmployeeId: resolvedOpeningEmployeeId,
      actorRole: resolvedActorRole,
      canManage: resolvedCanManage,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    throw error;
  }
});
