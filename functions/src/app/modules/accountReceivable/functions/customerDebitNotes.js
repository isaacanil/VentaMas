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
import { writeFiscalSequenceAudit } from '../../taxReceipt/services/fiscalSequenceAudit.service.js';
import { resolveBusinessFiscalRollout } from '../../taxReceipt/utils/fiscalRollout.util.js';
import {
  getGisysFactConfigIssues,
  resolveGisysFactConfig,
} from '../../electronicTaxReceipts/config/gisysFact.config.js';
import { getGisysFactPlatformConfig } from '../../electronicTaxReceipts/config/gisysFactPlatform.config.js';

const LOCKED_DEBIT_NOTE_STATUSES = new Set([
  'issued',
  'paid',
  'partially_paid',
  'cancelled',
  'voided',
  'electronic_pending',
  'electronic_failed',
]);
const DEBIT_NOTE_NCF_TYPE = 'NOTAS DE DÉBITO';
const DEBIT_NOTE_ELECTRONIC_DOCUMENT_TYPE = 'E33';
const DEFAULT_DEBIT_NOTE_MODIFICATION_CODE = '3';
const DEFAULT_DEBIT_NOTE_REASON = 'Correccion de montos';
const DGII_ADJUSTMENT_MODIFICATION_CODES = new Set(['1', '2', '3', '4', '5']);
const DEBIT_NOTE_ADJUSTMENT_ITEM_ID = 'debit-note-adjustment';
const DEBIT_NOTE_ADJUSTMENT_ITEM_NAME = 'Ajuste nota de débito';

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
  return DGII_ADJUSTMENT_MODIFICATION_CODES.has(normalized)
    ? normalized
    : null;
};

const resolveDebitNoteReason = (value) =>
  toCleanString(value) || DEFAULT_DEBIT_NOTE_REASON;

const resolveInvoiceRecord = (invoiceSnap) =>
  asRecord(asRecord(invoiceSnap?.data()).data);

const resolveInvoiceTotalAmount = (invoice, fallbackValue) =>
  roundToTwoDecimals(
    safeNumber(fallbackValue) ||
      safeNumber(invoice?.totalPurchase?.value) ||
      safeNumber(invoice?.total),
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

const assertDebitNoteClientMatchesInvoice = ({ debitNoteClient, invoiceClient }) => {
  const noteFiscalId = resolveClientFiscalId(debitNoteClient);
  const invoiceFiscalId = resolveClientFiscalId(invoiceClient);
  if (noteFiscalId && invoiceFiscalId && noteFiscalId !== invoiceFiscalId) {
    throw new HttpsError(
      'failed-precondition',
      'La nota de débito debe emitirse al mismo cliente de la factura afectada.',
      {
        reason: 'debit-note-client-mismatch',
        invoiceFiscalId,
        noteFiscalId,
      },
    );
  }

  const noteClientId = resolveClientRecordId(debitNoteClient);
  const invoiceClientId = resolveClientRecordId(invoiceClient);
  if (
    (!noteFiscalId || !invoiceFiscalId) &&
    noteClientId &&
    invoiceClientId &&
    noteClientId !== invoiceClientId
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La nota de débito debe emitirse al mismo cliente de la factura afectada.',
      {
        reason: 'debit-note-client-mismatch',
        invoiceClientId,
        noteClientId,
      },
    );
  }
};

const isNearRate = (value, expected) =>
  Math.abs(safeNumber(value) - expected) < 0.02;

const resolveAdjustmentTaxProfile = ({ totalAmount, taxAmount }) => {
  const normalizedTotalAmount = roundToTwoDecimals(totalAmount);
  const normalizedTaxAmount = roundToTwoDecimals(taxAmount);

  if (normalizedTaxAmount <= 0) {
    return {
      netAmount: normalizedTotalAmount,
      taxAmount: 0,
      taxRate: 0,
      billingIndicator: '4',
    };
  }

  if (normalizedTaxAmount >= normalizedTotalAmount) {
    throw new HttpsError(
      'invalid-argument',
      'El ITBIS de la nota de débito debe ser menor que el total.',
      { reason: 'invalid-debit-note-tax-amount' },
    );
  }

  const netAmount = roundToTwoDecimals(
    normalizedTotalAmount - normalizedTaxAmount,
  );
  const effectiveRate = roundToTwoDecimals((normalizedTaxAmount / netAmount) * 100);
  if (isNearRate(effectiveRate, 18)) {
    return {
      netAmount,
      taxAmount: normalizedTaxAmount,
      taxRate: 18,
      billingIndicator: '1',
    };
  }
  if (isNearRate(effectiveRate, 16)) {
    return {
      netAmount,
      taxAmount: normalizedTaxAmount,
      taxRate: 16,
      billingIndicator: '2',
    };
  }

  throw new HttpsError(
    'invalid-argument',
    'El ITBIS de la nota de débito debe corresponder a una tasa DGII válida.',
    {
      reason: 'invalid-debit-note-tax-rate',
      effectiveRate,
      allowedRates: [16, 18],
    },
  );
};

const buildDebitNoteItems = ({ debitNoteData, reason }) => {
  const currentItems = Array.isArray(debitNoteData.items)
    ? debitNoteData.items.filter(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
  if (currentItems.length > 0) return currentItems;

  const totalAmount = roundToTwoDecimals(debitNoteData.totalAmount);
  const taxProfile = resolveAdjustmentTaxProfile({
    totalAmount,
    taxAmount: debitNoteData.taxAmount,
  });

  return [
    {
      id: DEBIT_NOTE_ADJUSTMENT_ITEM_ID,
      productId: DEBIT_NOTE_ADJUSTMENT_ITEM_ID,
      name: DEBIT_NOTE_ADJUSTMENT_ITEM_NAME,
      description: reason,
      itemKind: '2',
      billingIndicator: taxProfile.billingIndicator,
      amountToBuy: 1,
      quantity: 1,
      unitPrice: taxProfile.netAmount,
      price: { unit: taxProfile.netAmount, total: taxProfile.netAmount },
      taxRate: taxProfile.taxRate,
      taxAmount: taxProfile.taxAmount,
    },
  ];
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
      'GISYS FACT no está configurado para emitir notas de débito electrónicas.',
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

export const createCustomerDebitNote = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const debitNoteData = asRecord(payload.debitNote || payload.data);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!Object.keys(debitNoteData).length) {
      throw new HttpsError(
        'invalid-argument',
        'Los datos de la nota de débito son requeridos.',
      );
    }
    if (safeNumber(debitNoteData.totalAmount) <= 0) {
      throw new HttpsError(
        'invalid-argument',
        'La nota de débito requiere un total mayor que cero.',
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
        toCleanString(debitNoteData.invoiceId) ||
        toCleanString(debitNoteData.sourceInvoiceId);
      if (!invoiceId) {
        throw new HttpsError(
          'invalid-argument',
          'La nota de débito requiere una factura afectada.',
          { reason: 'missing-debit-note-invoice' },
        );
      }

      const [nextIdSnap, invoiceSnap] = await Promise.all([
        getNextIDTransactionalSnap(
          tx,
          { businessID: businessId, uid: authUid },
          'lastDebitNoteId',
        ),
        tx.get(db.doc(`businesses/${businessId}/invoices/${invoiceId}`)),
      ]);
      if (!invoiceSnap?.exists) {
        throw new HttpsError(
          'not-found',
          'La factura afectada por la nota de débito no existe.',
          { reason: 'debit-note-invoice-not-found', invoiceId },
        );
      }

      let invoiceNcf = toCleanString(debitNoteData.invoiceNcf);
      let invoiceNumber = toCleanString(debitNoteData.invoiceNumber);
      let invoiceDate = debitNoteData.invoiceDate || null;
      const invoice = resolveInvoiceRecord(invoiceSnap);
      invoiceNcf =
        invoiceNcf ||
        toCleanString(invoice.eNcf) ||
        toCleanString(invoice.ncf) ||
        toCleanString(invoice.NCF);
      invoiceNumber = invoiceNumber || toCleanString(invoice.numberID);
      invoiceDate = invoiceDate || invoice.date || invoice.createdAt || null;
      const invoiceTotalAmount = resolveInvoiceTotalAmount(
        invoice,
        debitNoteData.invoiceTotalAmount,
      );
      assertDebitNoteClientMatchesInvoice({
        debitNoteClient: debitNoteData.client,
        invoiceClient: invoice.client,
      });
      const rawModificationCode = toCleanString(debitNoteData.modificationCode);
      const modificationCode =
        normalizeModificationCode(rawModificationCode) ||
        DEFAULT_DEBIT_NOTE_MODIFICATION_CODE;
      const reason = resolveDebitNoteReason(debitNoteData.reason);
      if (rawModificationCode && !normalizeModificationCode(rawModificationCode)) {
        throw new HttpsError(
          'invalid-argument',
          'Código de modificación DGII inválido para la nota de débito.',
          { reason: 'invalid-debit-note-modification-code' },
        );
      }
      if (fiscalContext.electronicModelEnabled && (!invoiceNcf || !invoiceDate)) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de débito electrónica requiere NCF y fecha de la factura modificada.',
          {
            reason: 'missing-electronic-debit-note-reference',
            invoiceId,
          },
        );
      }

      const normalizedTotalAmount = roundToTwoDecimals(debitNoteData.totalAmount);
      const normalizedTaxAmount = roundToTwoDecimals(debitNoteData.taxAmount);
      const normalizedItems = buildDebitNoteItems({
        debitNoteData: {
          ...debitNoteData,
          totalAmount: normalizedTotalAmount,
          taxAmount: normalizedTaxAmount,
        },
        reason,
      });
      const numberID = applyNextIDTransactional(tx, nextIdSnap);
      let reservation = null;
      if (!fiscalContext.electronicModelEnabled) {
        reservation = await reserveNcf(tx, {
          businessId,
          userId: authUid,
          ncfType: DEBIT_NOTE_NCF_TYPE,
        });
        writeFiscalSequenceAudit(tx, {
          businessId,
          userId: authUid,
          usageId: reservation.usageId,
          ncfCode: reservation.ncfCode,
          taxReceiptName: DEBIT_NOTE_NCF_TYPE,
          engine: 'backend.reserveNcf',
          sourceType: 'debitNote',
          sourceFunction: 'createCustomerDebitNote',
          taxReceiptId: reservation?.taxReceiptRef?.id ?? null,
        });
      }

      const record = {
        ...debitNoteData,
        id,
        numberID,
        number: `ND-${year}-${String(numberID).padStart(6, '0')}`,
        ncf: reservation?.ncfCode ?? null,
        ncfUsageId: reservation?.usageId ?? null,
        status: fiscalContext.electronicModelEnabled
          ? 'electronic_pending'
          : 'issued',
        items: normalizedItems,
        totalAmount: normalizedTotalAmount,
        taxAmount: normalizedTaxAmount,
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
              documentType: DEBIT_NOTE_ELECTRONIC_DOCUMENT_TYPE,
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

      tx.set(db.doc(`businesses/${businessId}/debitNotes/${id}`), record);
      if (reservation?.usageId) {
        tx.set(
          db.doc(`businesses/${businessId}/ncfUsage/${reservation.usageId}`),
          {
            status: 'used',
            usedAt: FieldValue.serverTimestamp(),
            debitNoteId: id,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      if (fiscalContext.electronicModelEnabled) {
        const outboxRef = db.doc(
          `businesses/${businessId}/debitNotes/${id}/outbox/${nanoid()}`,
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
            ncfType: DEBIT_NOTE_NCF_TYPE,
            documentType: DEBIT_NOTE_ELECTRONIC_DOCUMENT_TYPE,
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
      result = { ok: true, debitNote: record };
    });

    return result;
  },
);

export const updateCustomerDebitNote = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const debitNoteId = toCleanString(payload.debitNoteId) || toCleanString(payload.id);
    const updates = asRecord(payload.updates);
    if (!businessId || !debitNoteId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId y debitNoteId son requeridos.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
    });

    await db.runTransaction(async (tx) => {
      const noteRef = db.doc(`businesses/${businessId}/debitNotes/${debitNoteId}`);
      const noteSnap = await tx.get(noteRef);
      if (!noteSnap.exists) {
        throw new HttpsError('not-found', 'La nota de débito ya no existe.');
      }
      const current = asRecord(noteSnap.data());
      const status = toCleanString(current.status) || 'issued';
      if (LOCKED_DEBIT_NOTE_STATUSES.has(status)) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de débito ya fue emitida o procesada. No se permite edición directa.',
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

    return { ok: true, debitNoteId };
  },
);
