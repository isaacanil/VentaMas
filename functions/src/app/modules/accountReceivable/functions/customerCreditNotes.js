import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import {
  applyNextIDTransactional,
  getNextIDTransactionalSnap,
} from '../../../core/utils/getNextID.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { reserveNcf } from '../../../versions/v2/invoice/services/ncf.service.js';
import { consumeCreditNotesTx } from '../../../versions/v2/invoice/services/creditNotes.service.js';
import { writeFiscalSequenceAudit } from '../../taxReceipt/services/fiscalSequenceAudit.service.js';
import { resolveBusinessFiscalRollout } from '../../taxReceipt/utils/fiscalRollout.util.js';

const LOCKED_CREDIT_NOTE_STATUSES = new Set([
  'issued',
  'applied',
  'fully_used',
  'cancelled',
  'voided',
]);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveBusinessId = (payload) =>
  toCleanString(payload.businessId) || toCleanString(payload.businessID);

const resolveActorDisplayName = (payload) =>
  toCleanString(payload.displayName) ||
  toCleanString(payload.name) ||
  toCleanString(payload.userName) ||
  '';

const assertFiscalSequenceEnabled = async (businessId) => {
  const businessSnap = await db.doc(`businesses/${businessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const fiscalRollout = resolveBusinessFiscalRollout(businessSnap.data());
  if (!fiscalRollout.sequenceEngineV2Enabled) {
    throw new HttpsError(
      'failed-precondition',
      'El motor fiscal v2 no está habilitado para este negocio.',
    );
  }
};

export const createCustomerCreditNote = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const creditNoteData = asRecord(payload.creditNote || payload.data);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!Object.keys(creditNoteData).length) {
      throw new HttpsError(
        'invalid-argument',
        'Los datos de la nota de crédito son requeridos.',
      );
    }
    if (safeNumber(creditNoteData.totalAmount) <= 0) {
      throw new HttpsError(
        'invalid-argument',
        'La nota de crédito requiere un total mayor que cero.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
    });
    await assertFiscalSequenceEnabled(businessId);

    const id = nanoid();
    const now = Timestamp.now();
    const year = new Date().getUTCFullYear();
    let result = null;

    await db.runTransaction(async (tx) => {
      const invoiceId =
        toCleanString(creditNoteData.invoiceId) ||
        toCleanString(creditNoteData.sourceInvoiceId);
      const [nextIdSnap, invoiceSnap] = await Promise.all([
        getNextIDTransactionalSnap(
          tx,
          { businessID: businessId, uid: authUid },
          'lastCreditNoteId',
        ),
        invoiceId
          ? tx.get(db.doc(`businesses/${businessId}/invoices/${invoiceId}`))
          : Promise.resolve(null),
      ]);
      let invoiceNcf = toCleanString(creditNoteData.invoiceNcf);
      let invoiceNumber = toCleanString(creditNoteData.invoiceNumber);
      if (invoiceSnap?.exists) {
        const invoice = asRecord(asRecord(invoiceSnap.data()).data);
        invoiceNcf = invoiceNcf || toCleanString(invoice.NCF);
        invoiceNumber = invoiceNumber || toCleanString(invoice.numberID);
      }

      const reservation = await reserveNcf(tx, {
        businessId,
        userId: authUid,
        ncfType: 'NOTAS DE CRÉDITO',
      });
      const numberID = applyNextIDTransactional(
        tx,
        nextIdSnap,
      );
      writeFiscalSequenceAudit(tx, {
        businessId,
        userId: authUid,
        usageId: reservation.usageId,
        ncfCode: reservation.ncfCode,
        taxReceiptName: 'NOTAS DE CRÉDITO',
        engine: 'backend.reserveNcf',
        sourceType: 'creditNote',
        sourceFunction: 'createCustomerCreditNote',
        taxReceiptId: reservation?.taxReceiptRef?.id ?? null,
      });

      const record = {
        ...creditNoteData,
        id,
        numberID,
        number: `NC-${year}-${String(numberID).padStart(6, '0')}`,
        ncf: reservation.ncfCode,
        ncfUsageId: reservation.usageId,
        status: 'issued',
        availableAmount:
          safeNumber(creditNoteData.availableAmount) ||
          safeNumber(creditNoteData.totalAmount),
        invoiceId: invoiceId ?? null,
        invoiceNcf: invoiceNcf ?? null,
        invoiceNumber: invoiceNumber ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: {
          uid: authUid,
          displayName: resolveActorDisplayName(payload),
        },
      };

      tx.set(db.doc(`businesses/${businessId}/creditNotes/${id}`), record);
      tx.set(
        db.doc(`businesses/${businessId}/ncfUsage/${reservation.usageId}`),
        {
          status: 'used',
          usedAt: FieldValue.serverTimestamp(),
          creditNoteId: id,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      result = { ok: true, creditNote: record };
    });

    return result;
  },
);

export const updateCustomerCreditNote = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const creditNoteId = toCleanString(payload.creditNoteId) || toCleanString(payload.id);
    const updates = asRecord(payload.updates);
    if (!businessId || !creditNoteId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId y creditNoteId son requeridos.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
    });

    await db.runTransaction(async (tx) => {
      const noteRef = db.doc(`businesses/${businessId}/creditNotes/${creditNoteId}`);
      const noteSnap = await tx.get(noteRef);
      if (!noteSnap.exists) {
        throw new HttpsError('not-found', 'La nota de crédito ya no existe.');
      }
      const current = asRecord(noteSnap.data());
      const status = toCleanString(current.status) || 'issued';
      if (LOCKED_CREDIT_NOTE_STATUSES.has(status)) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de crédito ya fue emitida o aplicada. No se permite edición directa.',
        );
      }

      tx.set(
        noteRef,
        {
          ...updates,
          updatedAt: Timestamp.now(),
          updatedBy: authUid,
        },
        { merge: true },
      );
    });

    return { ok: true, creditNoteId };
  },
);

export const applyCustomerCreditNotes = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const invoiceId = toCleanString(payload.invoiceId);
    const creditNotes = Array.isArray(payload.creditNotes)
      ? payload.creditNotes
      : [];
    const invoiceSnapshot = asRecord(payload.invoiceData);
    if (!businessId || !invoiceId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId e invoiceId son requeridos.',
      );
    }
    if (!creditNotes.length) {
      return { ok: true, applicationIds: [] };
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });

    let result = null;
    await db.runTransaction(async (tx) => {
      result = await consumeCreditNotesTx(tx, {
        businessId,
        userId: authUid,
        invoiceId,
        creditNotes,
        invoiceSnapshot,
      });
    });

    return {
      ok: true,
      applicationIds: result?.applicationIds || [],
    };
  },
);
