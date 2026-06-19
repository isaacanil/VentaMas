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
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { reserveNcf } from '../../../versions/v2/invoice/services/ncf.service.js';
import { consumeCreditNotesTx } from '../../../versions/v2/invoice/services/creditNotes.service.js';
import { writeFiscalSequenceAudit } from '../../taxReceipt/services/fiscalSequenceAudit.service.js';
import { resolveBusinessFiscalRollout } from '../../taxReceipt/utils/fiscalRollout.util.js';
import {
  getGisysFactConfigIssues,
  resolveGisysFactConfig,
} from '../../electronicTaxReceipts/config/gisysFact.config.js';
import { getGisysFactPlatformConfig } from '../../electronicTaxReceipts/config/gisysFactPlatform.config.js';

const LOCKED_CREDIT_NOTE_STATUSES = new Set([
  'issued',
  'applied',
  'fully_used',
  'cancelled',
  'voided',
  'electronic_pending',
  'electronic_failed',
]);
const CREDIT_NOTE_NCF_TYPE = 'NOTAS DE CRÉDITO';
const CREDIT_NOTE_ELECTRONIC_DOCUMENT_TYPE = 'E34';
const DEFAULT_CREDIT_NOTE_MODIFICATION_CODE = '3';
const DEFAULT_CREDIT_NOTE_REASON = 'Correccion de montos';
const DGII_ADJUSTMENT_MODIFICATION_CODES = new Set(['1', '2', '3', '4', '5']);
const TEXT_CORRECTION_MODIFICATION_CODE = '2';
const VOID_CREDIT_NOTE_STATUSES = new Set([
  'cancelled',
  'canceled',
  'rejected',
  'void',
  'voided',
]);
const CONFIRMED_REJECTED_ELECTRONIC_STATUSES = new Set(['rejected']);
const MONEY_EPSILON = 0.01;

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

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const resolveBusinessId = (payload) =>
  toCleanString(payload.businessId) || toCleanString(payload.businessID);

const resolveActorDisplayName = (payload) =>
  toCleanString(payload.displayName) ||
  toCleanString(payload.name) ||
  toCleanString(payload.userName) ||
  '';

const normalizeModificationCode = (value) => {
  const clean = toCleanString(value);
  if (!clean) return null;
  const normalized = /^\d+$/.test(clean) ? String(Number(clean)) : clean;
  return DGII_ADJUSTMENT_MODIFICATION_CODES.has(normalized) ? normalized : null;
};

const resolveCreditNoteReason = (value) =>
  toCleanString(value) || DEFAULT_CREDIT_NOTE_REASON;

const assertCreditNoteModificationCodeSupportsAmount = ({
  modificationCode,
  totalAmount,
}) => {
  if (modificationCode !== TEXT_CORRECTION_MODIFICATION_CODE) return;

  const requestedTotalAmount = roundToTwoDecimals(totalAmount);
  if (requestedTotalAmount <= MONEY_EPSILON) return;

  throw new HttpsError(
    'failed-precondition',
    'El código DGII 2 corrige texto y solo permite notas de crédito con monto en 0. Para una nota con importe, use el código 3 - Corrige montos.',
    {
      reason: 'credit-note-text-correction-requires-zero-amount',
      modificationCode,
      totalAmount: requestedTotalAmount,
    },
  );
};

const resolveInvoiceRecord = (invoiceSnap) =>
  asRecord(asRecord(invoiceSnap?.data()).data);

const resolveInvoiceTotalAmount = (invoice, fallbackValue) =>
  roundToTwoDecimals(
    safeNumber(fallbackValue) ||
      safeNumber(invoice?.totalPurchase?.value) ||
      safeNumber(invoice?.total) ||
      safeNumber(invoice?.payment?.value),
  );

const normalizeFiscalId = (value) => {
  const raw = toCleanString(value);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length ? digits : raw.toLowerCase();
};

const resolveClientFiscalId = (client) => {
  const record = asRecord(client);
  return normalizeFiscalId(
    record.personalID ??
      record.rnc ??
      record.RNC ??
      record.taxId ??
      record.taxID ??
      record.documentNumber ??
      record.identification,
  );
};

const resolveClientRecordId = (client) => {
  const record = asRecord(client);
  return toCleanString(record.id) || toCleanString(record.clientId);
};

const assertCreditNoteClientMatchesInvoice = ({
  creditNoteClient,
  invoiceClient,
}) => {
  const noteFiscalId = resolveClientFiscalId(creditNoteClient);
  const invoiceFiscalId = resolveClientFiscalId(invoiceClient);
  if (noteFiscalId && invoiceFiscalId && noteFiscalId !== invoiceFiscalId) {
    throw new HttpsError(
      'failed-precondition',
      'La nota de crédito debe emitirse al mismo cliente de la factura afectada.',
      {
        reason: 'credit-note-client-mismatch',
        invoiceFiscalId,
        noteFiscalId,
      },
    );
  }

  const noteClientId = resolveClientRecordId(creditNoteClient);
  const invoiceClientId = resolveClientRecordId(invoiceClient);
  if (
    (!noteFiscalId || !invoiceFiscalId) &&
    noteClientId &&
    invoiceClientId &&
    noteClientId !== invoiceClientId
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La nota de crédito debe emitirse al mismo cliente de la factura afectada.',
      {
        reason: 'credit-note-client-mismatch',
        invoiceClientId,
        noteClientId,
      },
    );
  }
};

const resolveLineItemId = (item) =>
  toCleanString(item?.id) ||
  toCleanString(item?.productId) ||
  toCleanString(item?.cid) ||
  toCleanString(item?.sku) ||
  null;

const resolveQuantity = (value) => {
  const record = asRecord(value);
  if (Object.keys(record).length > 0) {
    return safeNumber(record.total ?? record.value ?? record.quantity ?? 0);
  }
  return safeNumber(value);
};

const buildQuantityMap = (items) =>
  (Array.isArray(items) ? items : []).reduce((accumulator, item) => {
    const itemId = resolveLineItemId(item);
    if (!itemId) return accumulator;
    const quantity = resolveQuantity(
      item.amountToBuy ?? item.quantity ?? item.qty,
    );
    accumulator.set(
      itemId,
      roundToTwoDecimals((accumulator.get(itemId) || 0) + quantity),
    );
    return accumulator;
  }, new Map());

const shouldIncludeCreditNoteInReferenceTotals = (creditNote) => {
  const status = toCleanString(creditNote?.status)?.toLowerCase();
  if (status && VOID_CREDIT_NOTE_STATUSES.has(status)) return false;

  if (status === 'electronic_failed') {
    const electronicTaxReceipt = asRecord(creditNote?.electronicTaxReceipt);
    const fiscalStatus = toCleanString(
      electronicTaxReceipt.status,
    )?.toLowerCase();
    return !(
      CONFIRMED_REJECTED_ELECTRONIC_STATUSES.has(fiscalStatus) ||
      electronicTaxReceipt.requiresNewENcf === true
    );
  }

  return true;
};

const validateCreditNoteAgainstInvoice = ({
  creditNoteData,
  invoice,
  invoiceTotalAmount,
  existingCreditNotesSnap,
}) => {
  const existingCreditNotes = existingCreditNotesSnap?.docs || [];
  const relevantExistingCreditNotes = existingCreditNotes
    .map((doc) => asRecord(doc.data()))
    .filter(shouldIncludeCreditNoteInReferenceTotals);
  const existingTotalAmount = roundToTwoDecimals(
    relevantExistingCreditNotes.reduce(
      (total, note) =>
        total + safeNumber(note.totalAmount ?? note.amount ?? note.total),
      0,
    ),
  );
  const requestedTotalAmount = roundToTwoDecimals(creditNoteData.totalAmount);
  if (
    invoiceTotalAmount > 0 &&
    existingTotalAmount + requestedTotalAmount >
      invoiceTotalAmount + MONEY_EPSILON
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La suma de notas de crédito no puede exceder el total de la factura afectada.',
      {
        reason: 'credit-note-total-exceeds-invoice',
        invoiceTotalAmount,
        existingCreditNoteAmount: existingTotalAmount,
        requestedCreditNoteAmount: requestedTotalAmount,
      },
    );
  }

  const invoiceQuantities = buildQuantityMap(invoice.products);
  if (invoiceQuantities.size === 0) return;

  const creditedQuantities = relevantExistingCreditNotes.reduce(
    (accumulator, note) => {
      for (const [itemId, quantity] of buildQuantityMap(note.items).entries()) {
        accumulator.set(
          itemId,
          roundToTwoDecimals((accumulator.get(itemId) || 0) + quantity),
        );
      }
      return accumulator;
    },
    new Map(),
  );
  const requestedQuantities = buildQuantityMap(creditNoteData.items);
  for (const [itemId, requestedQuantity] of requestedQuantities.entries()) {
    const originalQuantity = invoiceQuantities.get(itemId) || 0;
    const alreadyCreditedQuantity = creditedQuantities.get(itemId) || 0;
    if (
      originalQuantity > 0 &&
      alreadyCreditedQuantity + requestedQuantity >
        originalQuantity + MONEY_EPSILON
    ) {
      throw new HttpsError(
        'failed-precondition',
        'La nota de crédito excede la cantidad disponible en la factura afectada.',
        {
          reason: 'credit-note-quantity-exceeds-invoice',
          itemId,
          originalQuantity,
          alreadyCreditedQuantity,
          requestedQuantity,
        },
      );
    }
  }
};

const resolveFiscalIssuanceContext = async (businessId) => {
  const businessSnap = await db.doc(`businesses/${businessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const business = businessSnap.data() || {};
  const fiscalRollout = resolveBusinessFiscalRollout(business);
  if (
    !fiscalRollout.sequenceEngineV2Enabled &&
    !fiscalRollout.electronicModelEnabled
  ) {
    throw new HttpsError(
      'failed-precondition',
      'El motor fiscal v2 no está habilitado para este negocio.',
    );
  }

  if (!fiscalRollout.electronicModelEnabled) {
    return {
      business,
      fiscalRollout,
      electronicModelEnabled: false,
      electronicTransportEnabled: false,
      providerConfig: null,
    };
  }

  const platformConfig = await getGisysFactPlatformConfig();
  const providerConfig = resolveGisysFactConfig(business, platformConfig);
  const requireTransport = fiscalRollout.electronicTransportEnabled === true;
  const configIssues = getGisysFactConfigIssues(providerConfig, {
    requireTransport,
  });
  if (configIssues.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      'GISYS FACT no está configurado para emitir notas de crédito electrónicas.',
      {
        reason: 'gisys-config-invalid',
        issues: configIssues,
      },
    );
  }

  return {
    business,
    fiscalRollout,
    electronicModelEnabled: true,
    electronicTransportEnabled: requireTransport,
    providerConfig,
  };
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
    const fiscalContext = await resolveFiscalIssuanceContext(businessId);

    const id = nanoid();
    const now = Timestamp.now();
    const year = new Date().getUTCFullYear();
    let result = null;

    await db.runTransaction(async (tx) => {
      const invoiceId =
        toCleanString(creditNoteData.invoiceId) ||
        toCleanString(creditNoteData.sourceInvoiceId);
      if (!invoiceId) {
        throw new HttpsError(
          'invalid-argument',
          'La nota de crédito requiere una factura afectada.',
          { reason: 'missing-credit-note-invoice' },
        );
      }

      const existingCreditNotesQuery = db
        .collection(`businesses/${businessId}/creditNotes`)
        .where('invoiceId', '==', invoiceId);
      const [nextIdSnap, invoiceSnap, existingCreditNotesSnap] =
        await Promise.all([
          getNextIDTransactionalSnap(
            tx,
            { businessID: businessId, uid: authUid },
            'lastCreditNoteId',
          ),
          tx.get(db.doc(`businesses/${businessId}/invoices/${invoiceId}`)),
          tx.get(existingCreditNotesQuery),
        ]);
      if (!invoiceSnap?.exists) {
        throw new HttpsError(
          'not-found',
          'La factura afectada por la nota de crédito no existe.',
          { reason: 'credit-note-invoice-not-found', invoiceId },
        );
      }
      let invoiceNcf = toCleanString(creditNoteData.invoiceNcf);
      let invoiceNumber = toCleanString(creditNoteData.invoiceNumber);
      let invoiceDate = creditNoteData.invoiceDate || null;
      const invoice = resolveInvoiceRecord(invoiceSnap);
      invoiceNcf = invoiceNcf || toCleanString(invoice.NCF);
      invoiceNumber = invoiceNumber || toCleanString(invoice.numberID);
      invoiceDate = invoiceDate || invoice.date || invoice.createdAt || null;
      const invoiceTotalAmount = resolveInvoiceTotalAmount(
        invoice,
        creditNoteData.invoiceTotalAmount,
      );
      assertCreditNoteClientMatchesInvoice({
        creditNoteClient: creditNoteData.client,
        invoiceClient: invoice.client,
      });
      const rawModificationCode = toCleanString(
        creditNoteData.modificationCode,
      );
      const modificationCode =
        normalizeModificationCode(rawModificationCode) ||
        DEFAULT_CREDIT_NOTE_MODIFICATION_CODE;
      const reason = resolveCreditNoteReason(creditNoteData.reason);
      if (
        rawModificationCode &&
        !normalizeModificationCode(rawModificationCode)
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Código de modificación DGII inválido para la nota de crédito.',
          { reason: 'invalid-credit-note-modification-code' },
        );
      }
      assertCreditNoteModificationCodeSupportsAmount({
        modificationCode,
        totalAmount: creditNoteData.totalAmount,
      });
      validateCreditNoteAgainstInvoice({
        creditNoteData,
        invoice,
        invoiceTotalAmount,
        existingCreditNotesSnap,
      });
      if (
        fiscalContext.electronicModelEnabled &&
        (!invoiceNcf || !invoiceDate)
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de crédito electrónica requiere NCF y fecha de la factura modificada.',
          {
            reason: 'missing-electronic-credit-note-reference',
            invoiceId,
          },
        );
      }

      const numberID = applyNextIDTransactional(tx, nextIdSnap);
      let reservation = null;
      if (!fiscalContext.electronicModelEnabled) {
        reservation = await reserveNcf(tx, {
          businessId,
          userId: authUid,
          ncfType: CREDIT_NOTE_NCF_TYPE,
        });
        writeFiscalSequenceAudit(tx, {
          businessId,
          userId: authUid,
          usageId: reservation.usageId,
          ncfCode: reservation.ncfCode,
          taxReceiptName: CREDIT_NOTE_NCF_TYPE,
          engine: 'backend.reserveNcf',
          sourceType: 'creditNote',
          sourceFunction: 'createCustomerCreditNote',
          taxReceiptId: reservation?.taxReceiptRef?.id ?? null,
        });
      }

      const record = {
        ...creditNoteData,
        id,
        numberID,
        number: `NC-${year}-${String(numberID).padStart(6, '0')}`,
        ncf: reservation?.ncfCode ?? null,
        ncfUsageId: reservation?.usageId ?? null,
        status: fiscalContext.electronicModelEnabled
          ? 'electronic_pending'
          : 'issued',
        availableAmount:
          safeNumber(creditNoteData.availableAmount) ||
          safeNumber(creditNoteData.totalAmount),
        invoiceId: invoiceId ?? null,
        invoiceNcf: invoiceNcf ?? null,
        invoiceNumber: invoiceNumber ?? null,
        invoiceDate: invoiceDate ?? null,
        invoiceTotalAmount: invoiceTotalAmount || null,
        modificationCode,
        reason,
        fiscalMode: fiscalContext.electronicModelEnabled
          ? 'electronic_ecf'
          : 'traditional_ncf',
        documentFormat: fiscalContext.electronicModelEnabled
          ? 'electronic'
          : 'traditional',
        electronicTaxReceipt: fiscalContext.electronicModelEnabled
          ? {
              provider:
                fiscalContext.providerConfig?.providerId || 'gisys_fact',
              mode: fiscalContext.electronicTransportEnabled
                ? fiscalContext.providerConfig?.mode || 'pilot'
                : 'shadow',
              status: 'pending',
              documentType: CREDIT_NOTE_ELECTRONIC_DOCUMENT_TYPE,
              transportEnabled: fiscalContext.electronicTransportEnabled,
            }
          : null,
        createdAt: now,
        updatedAt: now,
        createdBy: {
          uid: authUid,
          displayName: resolveActorDisplayName(payload),
        },
      };

      tx.set(db.doc(`businesses/${businessId}/creditNotes/${id}`), record);
      if (reservation?.usageId) {
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
      }
      if (fiscalContext.electronicModelEnabled) {
        const outboxRef = db.doc(
          `businesses/${businessId}/creditNotes/${id}/outbox/${nanoid()}`,
        );
        tx.set(outboxRef, {
          id: outboxRef.id,
          type: 'issueElectronicTaxReceipt',
          status: 'pending',
          attempts: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          payload: {
            businessId,
            userId: authUid,
            ncfType: CREDIT_NOTE_NCF_TYPE,
            documentType: CREDIT_NOTE_ELECTRONIC_DOCUMENT_TYPE,
            transportEnabled: fiscalContext.electronicTransportEnabled,
            mode: fiscalContext.electronicTransportEnabled ? null : 'shadow',
            reference: {
              modifiedENcf: invoiceNcf ?? null,
              modifiedDocumentDate: invoiceDate ?? null,
              modificationCode,
              reason,
            },
          },
        });
      }
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
    const creditNoteId =
      toCleanString(payload.creditNoteId) || toCleanString(payload.id);
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
      const noteRef = db.doc(
        `businesses/${businessId}/creditNotes/${creditNoteId}`,
      );
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
      });
    });

    return {
      ok: true,
      applicationIds: result?.applicationIds || [],
    };
  },
);
