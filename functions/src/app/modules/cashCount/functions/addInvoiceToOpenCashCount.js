import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import { linkSaleToCashCountInTransaction } from '../services/cashCountSales.service.js';
import {
  asRecord,
  resolveCashCountEmployeeId,
  toUserRef,
} from '../utils/cashCountCallable.util.js';

const resolveInvoiceId = (payload) => {
  const directInvoiceId = toCleanString(payload.invoiceId);
  if (directInvoiceId) return directInvoiceId;

  const invoicePath = toCleanString(payload.invoicePath);
  if (!invoicePath) return null;

  const segments = invoicePath.split('/').filter(Boolean);
  return toCleanString(segments.at(-1)) || null;
};

const assertDocumentId = (value, fieldName) => {
  const cleanValue = toCleanString(value);
  if (!cleanValue || cleanValue.includes('/')) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} debe ser un ID de documento valido`,
    );
  }
  return cleanValue;
};

const assertInvoicePathMatchesBusiness = ({ businessId, invoiceId, payload }) => {
  const invoicePath = toCleanString(payload.invoicePath);
  if (!invoicePath) return;

  const expectedPath = `businesses/${businessId}/invoices/${invoiceId}`;
  if (invoicePath !== expectedPath) {
    throw new HttpsError(
      'invalid-argument',
      'invoicePath no coincide con businessId/invoiceId',
    );
  }
};

export const addInvoiceToOpenCashCount = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId = assertDocumentId(
    toCleanString(payload.businessId) || toCleanString(payload.businessID),
    'businessId',
  );
  const invoiceId = assertDocumentId(resolveInvoiceId(payload), 'invoiceId');
  assertInvoicePathMatchesBusiness({ businessId, invoiceId, payload });

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  const userRef = toUserRef(authUid);
  const openCashCountSnap = await db
    .collection(`businesses/${businessId}/cashCounts`)
    .where('cashCount.state', '==', 'open')
    .where('cashCount.opening.employee', '==', userRef)
    .limit(1)
    .get();

  if (openCashCountSnap.empty) {
    throw new HttpsError(
      'failed-precondition',
      'No hay cuadre de caja abierto para el cajero actual',
    );
  }

  const cashCountRef = openCashCountSnap.docs[0].ref;
  const invoiceRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
  let linkResult = null;

  await db.runTransaction(async (tx) => {
    const cashCountSnap = await tx.get(cashCountRef);
    if (!cashCountSnap.exists) {
      throw new HttpsError('not-found', 'Cuadre de caja no encontrado');
    }

    const cashCountState =
      cashCountSnap.get?.('cashCount.state') ||
      cashCountSnap.data?.()?.cashCount?.state ||
      null;
    if (cashCountState !== 'open') {
      throw new HttpsError(
        'failed-precondition',
        `El cuadre de caja no esta abierto (estado=${cashCountState || 'unknown'})`,
      );
    }

    const openingEmployeeId = resolveCashCountEmployeeId(
      cashCountSnap.get?.('cashCount.opening.employee'),
    );
    if (openingEmployeeId !== authUid) {
      throw new HttpsError(
        'permission-denied',
        'No autorizado para modificar el cuadre de otro cajero',
      );
    }

    const invoiceSnap = await tx.get(invoiceRef);
    if (!invoiceSnap.exists) {
      throw new HttpsError('not-found', 'Factura no encontrada');
    }

    linkResult = await linkSaleToCashCountInTransaction({
      tx,
      businessId,
      cashCountId: cashCountRef.id,
      cashCountRef,
      invoiceId,
      invoiceRef,
      cashCountSnap,
      createdBy: authUid,
      source: {
        type: 'addInvoiceToOpenCashCount',
      },
    });
  });

  return {
    ok: true,
    businessId,
    invoiceId,
    cashCountId: linkResult?.cashCountId || cashCountRef.id,
    alreadyLinked: linkResult?.alreadyLinked === true,
  };
});
