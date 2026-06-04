import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import {
  asRecord,
  buildBusinessPartyPayload,
  buildHrEmployeePayload,
  normalizeHrEmployeeInput,
  toSerializableHrEmployee,
  validateHrEmployeeInput,
} from '../services/hrEmployees.service.js';

const hasDuplicateCode = (snapshot, employeeId) =>
  snapshot.docs.some((docSnap) => docSnap.id !== employeeId);

export const manageHrEmployee = onCall(async (request) => {
  try {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const employeeInput = asRecord(payload.employee);
    const businessId =
      toCleanString(payload.businessId) ||
      toCleanString(payload.businessID) ||
      toCleanString(employeeInput.businessId) ||
      toCleanString(employeeInput.businessID) ||
      null;

    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!Object.keys(employeeInput).length) {
      throw new HttpsError('invalid-argument', 'employee es requerido');
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_WRITE,
    });

    const employee = normalizeHrEmployeeInput(employeeInput, {
      fallbackId: nanoid(10),
    });
    const validationErrors = validateHrEmployeeInput(employee);
    if (validationErrors.length) {
      throw new HttpsError('invalid-argument', validationErrors.join(' '));
    }

    let serializedEmployee = null;

    await db.runTransaction(async (transaction) => {
      const timestamp = FieldValue.serverTimestamp();
      const employeeRef = db.doc(
        `businesses/${businessId}/hrEmployees/${employee.employeeId}`,
      );
      const partyRef = db.doc(
        `businesses/${businessId}/businessParties/${employee.partyId}`,
      );
      const serviceCommissionCollaboratorRef = db.doc(
        `businesses/${businessId}/serviceCommissionCollaborators/${employee.employeeId}`,
      );
      const duplicateCodeQuery = db
        .collection(`businesses/${businessId}/hrEmployees`)
        .where('code', '==', employee.code)
        .limit(5);

      const existingEmployeeSnap = await transaction.get(employeeRef);
      const duplicateCodeSnap = await transaction.get(duplicateCodeQuery);
      const previousLinkedUserId = existingEmployeeSnap.exists
        ? toCleanString(existingEmployeeSnap.data()?.linkedUserId)
        : null;

      let memberRef = null;
      let memberSnap = null;
      let linkedUserRef = null;
      let previousMemberRef = null;
      let previousLinkedUserRef = null;
      if (employee.linkedUserId) {
        memberRef = db.doc(
          `businesses/${businessId}/members/${employee.linkedUserId}`,
        );
        linkedUserRef = db.doc(`users/${employee.linkedUserId}`);
        memberSnap = await transaction.get(memberRef);
        if (!memberSnap.exists) {
          throw new HttpsError(
            'invalid-argument',
            'El usuario vinculado debe pertenecer al negocio.',
          );
        }
      }
      if (
        previousLinkedUserId &&
        previousLinkedUserId !== employee.linkedUserId
      ) {
        previousMemberRef = db.doc(
          `businesses/${businessId}/members/${previousLinkedUserId}`,
        );
        previousLinkedUserRef = db.doc(`users/${previousLinkedUserId}`);
      }

      if (hasDuplicateCode(duplicateCodeSnap, employee.employeeId)) {
        throw new HttpsError(
          'already-exists',
          'Ya existe un empleado con este codigo.',
        );
      }

      const isNew = !existingEmployeeSnap.exists;
      const partyPayload = buildBusinessPartyPayload({
        businessId,
        employee,
        timestamp,
        authUid,
        isNew,
      });
      const employeePayload = buildHrEmployeePayload({
        businessId,
        employee,
        timestamp,
        authUid,
        isNew,
      });

      transaction.set(partyRef, partyPayload, { merge: true });
      transaction.set(employeeRef, employeePayload, { merge: true });
      if (
        employee.commissionEnabled ||
        existingEmployeeSnap.data()?.commissionEnabled === true
      ) {
        transaction.set(
          serviceCommissionCollaboratorRef,
          {
            id: employee.employeeId,
            businessId,
            code: employee.code,
            name: employee.fullName,
            documentType: employee.documentType,
            documentId: employee.documentId,
            gender: employee.gender,
            linkedUserId: employee.linkedUserId,
            hrEmployeeId: employee.employeeId,
            partyId: employee.partyId,
            defaultType: employee.defaultCommissionType,
            defaultRate: employee.defaultCommissionRate || 0,
            serviceCommissionRules: employee.serviceCommissionRules,
            active:
              employee.commissionEnabled === true &&
              employee.status === 'active',
            source: 'hrEmployee',
            updatedAt: timestamp,
            updatedBy: authUid,
            ...(isNew ? { createdAt: timestamp, createdBy: authUid } : {}),
          },
          { merge: true },
        );
      }

      if (memberRef && linkedUserRef) {
        transaction.set(
          memberRef,
          {
            partyId: employee.partyId,
            hrEmployeeId: employee.employeeId,
            updatedAt: timestamp,
            updatedBy: authUid,
          },
          { merge: true },
        );
        transaction.set(
          linkedUserRef,
          {
            partyLinks: {
              [businessId]: {
                partyId: employee.partyId,
                hrEmployeeId: employee.employeeId,
                updatedAt: timestamp,
              },
            },
          },
          { merge: true },
        );
      }
      if (previousMemberRef && previousLinkedUserRef) {
        transaction.set(
          previousMemberRef,
          {
            partyId: null,
            hrEmployeeId: null,
            updatedAt: timestamp,
            updatedBy: authUid,
          },
          { merge: true },
        );
        transaction.set(
          previousLinkedUserRef,
          {
            partyLinks: {
              [businessId]: {
                partyId: null,
                hrEmployeeId: null,
                updatedAt: timestamp,
              },
            },
          },
          { merge: true },
        );
      }

      serializedEmployee = toSerializableHrEmployee(employeePayload);
    });

    return {
      ok: true,
      businessId,
      employeeId: employee.employeeId,
      partyId: employee.partyId,
      employee: serializedEmployee,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('manageHrEmployee failed unexpectedly', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      data: request?.data || null,
    });
    throw new HttpsError(
      'internal',
      'No se pudo guardar el empleado en este momento.',
    );
  }
});
