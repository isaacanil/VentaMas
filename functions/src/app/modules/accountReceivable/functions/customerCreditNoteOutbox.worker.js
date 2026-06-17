import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { GISYS_FACT_SECRETS } from '../../../core/config/secrets.js';
import { buildElectronicTaxReceiptAttemptRecord } from '../../electronicTaxReceipts/services/electronicTaxReceiptAttempt.service.js';
import { issueElectronicTaxReceiptForDocument } from '../../electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js';

const CREDIT_NOTE_DOCUMENT_TYPE = 'E34';
const CREDIT_NOTE_NCF_TYPE = 'NOTAS DE CRÉDITO';

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

const resolveReference = ({ creditNote, invoiceData, taskPayload }) => {
  const reference = asRecord(taskPayload.reference);
  return {
    modifiedENcf:
      toCleanString(reference.modifiedENcf) ||
      toCleanString(reference.modifiedNcf) ||
      toCleanString(creditNote.invoiceNcf) ||
      toCleanString(invoiceData.eNcf) ||
      toCleanString(invoiceData.NCF),
    modifiedDocumentDate:
      normalizeDate(reference.modifiedDocumentDate) ||
      normalizeDate(creditNote.invoiceDate) ||
      normalizeDate(invoiceData.date) ||
      normalizeDate(invoiceData.createdAt),
    modificationCode:
      toCleanString(reference.modificationCode) ||
      toCleanString(creditNote.modificationCode) ||
      '3',
    reason:
      toCleanString(reference.reason) ||
      toCleanString(creditNote.reason) ||
      'Correccion de montos',
  };
};

const buildIssueDocument = ({ creditNote, invoiceData }) => ({
  createdAt: creditNote.createdAt,
  snapshot: {
    cart: {
      products: Array.isArray(creditNote.items) ? creditNote.items : [],
      client: creditNote.client || invoiceData.client || null,
      taxReceiptName: CREDIT_NOTE_NCF_TYPE,
    },
    client: creditNote.client || invoiceData.client || null,
    ncf: {
      type: CREDIT_NOTE_NCF_TYPE,
      code: creditNote.ncf || null,
      documentFormat: 'electronic',
      documentType: CREDIT_NOTE_DOCUMENT_TYPE,
    },
    invoiceComment: creditNote.reason || null,
  },
});

export const resolveCreditNoteStatus = (electronicSnapshot) => {
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

export const processCustomerCreditNoteOutbox = onDocumentCreated(
  {
    document: 'businesses/{businessId}/creditNotes/{creditNoteId}/outbox/{taskId}',
    region: 'us-central1',
    secrets: GISYS_FACT_SECRETS,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn('processCustomerCreditNoteOutbox missing snapshot');
      return null;
    }

    const { businessId, creditNoteId, taskId } = event.params;
    const task = snap.data() || {};
    if (task.status !== 'pending') return null;
    if (task.type !== 'issueElectronicTaxReceipt') return null;

    const taskRef = snap.ref;
    const noteRef = db.doc(`businesses/${businessId}/creditNotes/${creditNoteId}`);
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) {
      await taskRef.set(
        {
          status: 'failed',
          attempts: (task.attempts || 0) + 1,
          lastError: 'Credit note document not found',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return null;
    }

    const creditNote = noteSnap.data() || {};
    const invoiceId = toCleanString(creditNote.invoiceId);
    const invoiceSnap = invoiceId
      ? await db.doc(`businesses/${businessId}/invoices/${invoiceId}`).get()
      : null;
    const invoiceData = invoiceSnap?.exists ? resolveInvoiceData(invoiceSnap) : {};
    const reference = resolveReference({
      creditNote,
      invoiceData,
      taskPayload: asRecord(task.payload),
    });
    const issueDocument = buildIssueDocument({ creditNote, invoiceData });
    const issuePayload = {
      ...asRecord(task.payload),
      cart: issueDocument.snapshot.cart,
      client: issueDocument.snapshot.client,
      ncfType: CREDIT_NOTE_NCF_TYPE,
      documentType: CREDIT_NOTE_DOCUMENT_TYPE,
      reference,
      invoiceComment: creditNote.reason || reference.reason || null,
    };

    try {
      const result = await issueElectronicTaxReceiptForDocument({
        businessId,
        documentId: creditNoteId,
        document: issueDocument,
        taskPayload: issuePayload,
      });
      const attemptId = taskId;
      const electronicSnapshot = {
        ...result.electronicSnapshot,
        attemptId,
        outboxTaskId: taskId,
      };
      const resultWithAttempt = {
        ...result,
        electronicSnapshot,
      };
      const nextNoteStatus = resolveCreditNoteStatus(electronicSnapshot);
      const eNcf =
        result.response?.eNcf || electronicSnapshot.eNcf || creditNote.ncf || null;
      const attemptRecord = buildElectronicTaxReceiptAttemptRecord({
        attemptId,
        businessId,
        documentKind: 'creditNote',
        documentId: creditNoteId,
        documentType: CREDIT_NOTE_DOCUMENT_TYPE,
        ncfType: CREDIT_NOTE_NCF_TYPE,
        note: creditNote,
        taskId,
        task,
        issuePayload: result.issuePayload || issuePayload,
        result: resultWithAttempt,
      });

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
              attemptId,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        tx.set(
          noteRef.collection('fiscalAttempts').doc(attemptId),
          attemptRecord,
          { merge: true },
        );
        tx.set(
          noteRef,
          {
            ncf: eNcf,
            eNcf,
            status: nextNoteStatus,
            electronicTaxReceipt: electronicSnapshot,
            fiscalMode: 'electronic_ecf',
            documentFormat: 'electronic',
            currentFiscalAttemptId: attemptId,
            updatedAt: FieldValue.serverTimestamp(),
            statusTimeline: FieldValue.arrayUnion({
              status: `electronic_tax_receipt_${electronicSnapshot.status}`,
              at: Timestamp.now(),
            }),
          },
          { merge: true },
        );
      });
    } catch (error) {
      logger.error('processCustomerCreditNoteOutbox error', {
        businessId,
        creditNoteId,
        taskId,
        error,
      });
      await db.runTransaction(async (tx) => {
        const currentTask = await tx.get(taskRef);
        if (currentTask.data()?.status !== 'pending') return;
        const attemptId = taskId;
        const lastError = error?.message || String(error);
        const electronicSnapshot = {
          provider: 'gisys_fact',
          status: 'local_failed',
          documentType: CREDIT_NOTE_DOCUMENT_TYPE,
          lastError,
          attemptId,
          outboxTaskId: taskId,
          updatedAt: FieldValue.serverTimestamp(),
        };
        const attemptRecord = buildElectronicTaxReceiptAttemptRecord({
          attemptId,
          businessId,
          documentKind: 'creditNote',
          documentId: creditNoteId,
          documentType: CREDIT_NOTE_DOCUMENT_TYPE,
          ncfType: CREDIT_NOTE_NCF_TYPE,
          note: creditNote,
          taskId,
          task,
          issuePayload,
          result: { documentType: CREDIT_NOTE_DOCUMENT_TYPE, electronicSnapshot },
          error,
        });
        tx.set(
          taskRef,
          {
            status: 'failed',
            attempts: (task.attempts || 0) + 1,
            lastError,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        tx.set(
          noteRef.collection('fiscalAttempts').doc(attemptId),
          attemptRecord,
          { merge: true },
        );
        tx.set(
          noteRef,
          {
            status: 'electronic_failed',
            electronicTaxReceipt: electronicSnapshot,
            currentFiscalAttemptId: attemptId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
    }

    return null;
  },
);
