import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { GISYS_FACT_SECRETS } from '../../../core/config/secrets.js';
import { issueElectronicTaxReceiptForDocument } from '../../electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js';

const DEBIT_NOTE_DOCUMENT_TYPE = 'E33';
const DEBIT_NOTE_NCF_TYPE = 'NOTAS DE DÉBITO';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return normalizeDate(value.toDate());
  if (typeof value.toMillis === 'function') return normalizeDate(value.toMillis());
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value).toISOString() : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    if (seconds != null) return new Date(seconds * 1000).toISOString();
  }
  return null;
};

const resolveInvoiceData = (invoiceSnap) =>
  asRecord(asRecord(invoiceSnap?.data()).data);

const resolveReference = ({ debitNote, invoiceData, taskPayload }) => {
  const reference = asRecord(taskPayload.reference);
  return {
    modifiedENcf:
      toCleanString(reference.modifiedENcf) ||
      toCleanString(reference.modifiedNcf) ||
      toCleanString(debitNote.invoiceNcf) ||
      toCleanString(invoiceData.eNcf) ||
      toCleanString(invoiceData.NCF),
    modifiedDocumentDate:
      normalizeDate(reference.modifiedDocumentDate) ||
      normalizeDate(debitNote.invoiceDate) ||
      normalizeDate(invoiceData.date) ||
      normalizeDate(invoiceData.createdAt),
    modificationCode:
      toCleanString(reference.modificationCode) ||
      toCleanString(debitNote.modificationCode) ||
      '3',
    reason:
      toCleanString(reference.reason) ||
      toCleanString(debitNote.reason) ||
      'Correccion de montos',
  };
};

const buildIssueDocument = ({ debitNote, invoiceData }) => ({
  createdAt: debitNote.createdAt,
  snapshot: {
    cart: {
      products: Array.isArray(debitNote.items) ? debitNote.items : [],
      client: debitNote.client || invoiceData.client || null,
      taxReceiptName: DEBIT_NOTE_NCF_TYPE,
    },
    client: debitNote.client || invoiceData.client || null,
    ncf: {
      type: DEBIT_NOTE_NCF_TYPE,
      code: debitNote.ncf || null,
      documentFormat: 'electronic',
      documentType: DEBIT_NOTE_DOCUMENT_TYPE,
    },
    invoiceComment: debitNote.reason || null,
  },
});

export const resolveDebitNoteStatus = (electronicSnapshot) => {
  const status = toCleanString(electronicSnapshot?.status)?.toLowerCase();
  if (
    status === 'issued' ||
    status === 'accepted' ||
    status === 'accepted_conditional'
  ) {
    return 'issued';
  }
  if (status === 'shadow_ready') return 'issued';
  if (
    status === 'local_failed' ||
    status === 'failed' ||
    status === 'error' ||
    status === 'rejected'
  ) {
    return 'electronic_failed';
  }
  return 'electronic_pending';
};

export const processCustomerDebitNoteOutbox = onDocumentCreated(
  {
    document: 'businesses/{businessId}/debitNotes/{debitNoteId}/outbox/{taskId}',
    region: 'us-central1',
    secrets: GISYS_FACT_SECRETS,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn('processCustomerDebitNoteOutbox missing snapshot');
      return null;
    }

    const { businessId, debitNoteId, taskId } = event.params;
    const task = snap.data() || {};
    if (task.status !== 'pending') return null;
    if (task.type !== 'issueElectronicTaxReceipt') return null;

    const taskRef = snap.ref;
    const noteRef = db.doc(`businesses/${businessId}/debitNotes/${debitNoteId}`);
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) {
      await taskRef.set(
        {
          status: 'failed',
          attempts: (task.attempts || 0) + 1,
          lastError: 'Debit note document not found',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return null;
    }

    const debitNote = noteSnap.data() || {};
    const invoiceId = toCleanString(debitNote.invoiceId);
    const invoiceSnap = invoiceId
      ? await db.doc(`businesses/${businessId}/invoices/${invoiceId}`).get()
      : null;
    const invoiceData = invoiceSnap?.exists ? resolveInvoiceData(invoiceSnap) : {};
    const reference = resolveReference({
      debitNote,
      invoiceData,
      taskPayload: asRecord(task.payload),
    });
    const issueDocument = buildIssueDocument({ debitNote, invoiceData });
    const issuePayload = {
      ...asRecord(task.payload),
      cart: issueDocument.snapshot.cart,
      client: issueDocument.snapshot.client,
      ncfType: DEBIT_NOTE_NCF_TYPE,
      documentType: DEBIT_NOTE_DOCUMENT_TYPE,
      reference,
      invoiceComment: debitNote.reason || reference.reason || null,
    };

    try {
      const result = await issueElectronicTaxReceiptForDocument({
        businessId,
        documentId: debitNoteId,
        document: issueDocument,
        taskPayload: issuePayload,
      });
      const nextNoteStatus = resolveDebitNoteStatus(result.electronicSnapshot);
      const eNcf = result.response?.eNcf || debitNote.ncf || null;

      await db.runTransaction(async (tx) => {
        const currentTask = await tx.get(taskRef);
        if (currentTask.data()?.status !== 'pending') return;

        tx.set(
          taskRef,
          {
            status: 'done',
            processedAt: FieldValue.serverTimestamp(),
            attempts: (task.attempts || 0) + 1,
            lastError: null,
            result: {
              provider: 'gisys_fact',
              status: result.electronicSnapshot.status,
              documentType: result.documentType,
              submissionId: result.response?.submissionId || null,
              eNcf,
              requestHash: result.requestHash || null,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        tx.set(
          noteRef,
          {
            ncf: eNcf,
            eNcf,
            status: nextNoteStatus,
            electronicTaxReceipt: result.electronicSnapshot,
            fiscalMode: 'electronic_ecf',
            documentFormat: 'electronic',
            updatedAt: FieldValue.serverTimestamp(),
            statusTimeline: FieldValue.arrayUnion({
              status: `electronic_tax_receipt_${result.electronicSnapshot.status}`,
              at: Timestamp.now(),
            }),
          },
          { merge: true },
        );
      });
    } catch (error) {
      logger.error('processCustomerDebitNoteOutbox error', {
        businessId,
        debitNoteId,
        taskId,
        error,
      });
      await db.runTransaction(async (tx) => {
        const currentTask = await tx.get(taskRef);
        if (currentTask.data()?.status !== 'pending') return;
        tx.set(
          taskRef,
          {
            status: 'failed',
            attempts: (task.attempts || 0) + 1,
            lastError: error?.message || String(error),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        tx.set(
          noteRef,
          {
            status: 'electronic_failed',
            electronicTaxReceipt: {
              provider: 'gisys_fact',
              status: 'local_failed',
              documentType: DEBIT_NOTE_DOCUMENT_TYPE,
              lastError: error?.message || String(error),
              updatedAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
    }

    return null;
  },
);
