import { db, FieldValue } from '../../../../core/config/firebase.js';
import {
  canCreateFinancialEffectsForAdjustmentNote,
  isElectronicAdjustmentNote,
  resolveElectronicAdjustmentNoteFiscalStatus,
} from '../../../../modules/accountReceivable/utils/customerAdjustmentNoteFiscalStatus.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const normalizeCreditNotesForConsumption = (creditNotes) => {
  const grouped = new Map();
  for (const note of Array.isArray(creditNotes) ? creditNotes : []) {
    const id = toCleanString(note?.id);
    const amountUsed = Number(note?.amountUsed);
    if (!id || !(amountUsed > 0)) continue;

    const existing = grouped.get(id);
    if (existing) {
      existing.amountUsed = roundCurrency(existing.amountUsed + amountUsed);
      continue;
    }

    grouped.set(id, {
      ...note,
      id,
      amountUsed: roundCurrency(amountUsed),
    });
  }

  return Array.from(grouped.values());
};

const isElectronicCreditNote = (creditNote) => {
  return isElectronicAdjustmentNote(creditNote, { ncfPrefix: 'E34' });
};

const resolveCanonicalInvoiceRecord = (invoiceSnap) => {
  const raw = asRecord(invoiceSnap?.data?.());
  return asRecord(raw.data ?? raw);
};

const resolveV2InvoiceRecord = (invoiceSnap) => {
  const raw = asRecord(invoiceSnap?.data?.());
  const snapshot = asRecord(raw.snapshot);
  const cart = asRecord(snapshot.cart ?? raw.cart);
  return {
    ...cart,
    ...snapshot,
    id: toCleanString(raw.id) || toCleanString(cart.id),
    client: snapshot.client ?? cart.client ?? null,
    ncf: snapshot.ncf ?? cart.ncf ?? cart.NCF ?? null,
    monetary: snapshot.monetary ?? cart.monetary ?? null,
    numberID: snapshot.numberID ?? cart.numberID ?? null,
    number: snapshot.number ?? cart.number ?? null,
    invoiceNumber: snapshot.invoiceNumber ?? cart.invoiceNumber ?? null,
  };
};

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

const resolveClientRecord = (record) =>
  asRecord(record.client ?? record.customer ?? record.clientSnapshot);

const resolveCurrencyCode = (value) => {
  const record = asRecord(value);
  const code =
    toCleanString(record.code) ||
    toCleanString(record.currencyCode) ||
    toCleanString(record.id) ||
    toCleanString(value);
  return code ? code.toUpperCase() : null;
};

const resolveDocumentCurrency = (record) => {
  const source = asRecord(record);
  return (
    resolveCurrencyCode(asRecord(source.monetary).documentCurrency) ||
    resolveCurrencyCode(source.documentCurrency) ||
    resolveCurrencyCode(source.currency) ||
    resolveCurrencyCode(source.currencyCode)
  );
};

const resolveInvoiceNcf = (invoice) => {
  const record = asRecord(invoice);
  return (
    toCleanString(asRecord(record.ncf).code) ||
    toCleanString(record.ncf) ||
    toCleanString(record.NCF) ||
    toCleanString(record.eNcf)
  );
};

const resolveInvoiceNumber = (invoice) => {
  const record = asRecord(invoice);
  return (
    toCleanString(record.numberID) ||
    toCleanString(record.number) ||
    toCleanString(record.invoiceNumber)
  );
};

const assertCreditNoteMatchesInvoice = ({
  creditNote,
  noteId,
  invoiceId,
  invoice,
}) => {
  const sourceInvoiceId =
    toCleanString(creditNote?.invoiceId) ||
    toCleanString(creditNote?.sourceInvoiceId) ||
    toCleanString(asRecord(creditNote?.invoice).id);
  if (sourceInvoiceId && sourceInvoiceId !== invoiceId) {
    throw new Error(
      `La nota de crédito ${creditNote?.ncf || creditNote?.number || noteId} pertenece a otra factura`,
    );
  }

  const noteClient = resolveClientRecord(creditNote);
  const invoiceClient = resolveClientRecord(invoice);
  const noteFiscalId = resolveClientFiscalId(noteClient);
  const invoiceFiscalId = resolveClientFiscalId(invoiceClient);
  if (noteFiscalId && invoiceFiscalId && noteFiscalId !== invoiceFiscalId) {
    throw new Error(
      `La nota de crédito ${creditNote?.ncf || creditNote?.number || noteId} pertenece a otro cliente`,
    );
  }

  const noteClientId = resolveClientRecordId(noteClient);
  const invoiceClientId = resolveClientRecordId(invoiceClient);
  if (
    (!noteFiscalId || !invoiceFiscalId) &&
    noteClientId &&
    invoiceClientId &&
    noteClientId !== invoiceClientId
  ) {
    throw new Error(
      `La nota de crédito ${creditNote?.ncf || creditNote?.number || noteId} pertenece a otro cliente`,
    );
  }

  const noteCurrency = resolveDocumentCurrency(creditNote);
  const invoiceCurrency = resolveDocumentCurrency(invoice);
  if (noteCurrency && invoiceCurrency && noteCurrency !== invoiceCurrency) {
    throw new Error(
      `La nota de crédito ${creditNote?.ncf || creditNote?.number || noteId} está en una moneda distinta a la factura`,
    );
  }
};

const assertCreditNoteFiscalStatusAllowsConsumption = (creditNote, noteId) => {
  if (!isElectronicCreditNote(creditNote)) return;

  if (
    canCreateFinancialEffectsForAdjustmentNote(creditNote, {
      ncfPrefix: 'E34',
    })
  ) {
    return;
  }

  const fiscalStatus = resolveElectronicAdjustmentNoteFiscalStatus(creditNote);

  throw new Error(
    `La nota de crédito ${creditNote?.ncf || creditNote?.number || noteId} no está aceptada fiscalmente y no puede aplicarse${fiscalStatus ? ` (${fiscalStatus})` : ''}`,
  );
};

/**
 * Consume notas de crédito y crea registros de aplicación en una transacción.
 * creditNotes: [{ id, amountUsed, ncf?, originalAmount? }]
 */
export async function consumeCreditNotesTx(
  tx,
  { businessId, userId, invoiceId, creditNotes = [] },
) {
  const normalizedCreditNotes = normalizeCreditNotesForConsumption(creditNotes);
  if (normalizedCreditNotes.length === 0)
    return { applicationIds: [] };

  const canonicalInvoiceRef = db.doc(
    `businesses/${businessId}/invoices/${invoiceId}`,
  );
  const canonicalInvoiceSnap = await tx.get(canonicalInvoiceRef);
  let invoiceRecord = null;
  if (canonicalInvoiceSnap.exists) {
    invoiceRecord = resolveCanonicalInvoiceRecord(canonicalInvoiceSnap);
  } else {
    const v2InvoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );
    const v2InvoiceSnap = await tx.get(v2InvoiceRef);
    if (v2InvoiceSnap.exists) {
      invoiceRecord = resolveV2InvoiceRecord(v2InvoiceSnap);
    }
  }
  if (!invoiceRecord) {
    throw new Error(`Factura ${invoiceId} no encontrada`);
  }
  const invoiceClient = resolveClientRecord(invoiceRecord);
  const invoiceNcf = resolveInvoiceNcf(invoiceRecord);
  const invoiceNumber = resolveInvoiceNumber(invoiceRecord);

  const createdApplicationIds = [];
  const applicationWrites = [];
  const creditNoteWrites = [];

  for (const note of normalizedCreditNotes) {
    if (!note?.id || !(Number(note?.amountUsed) > 0)) continue;

    const cnRef = db.doc(`businesses/${businessId}/creditNotes/${note.id}`);
    const cnSnap = await tx.get(cnRef);
    if (!cnSnap.exists) {
      throw new Error(`Nota de crédito ${note.id} no encontrada`);
    }
    const cnData = cnSnap.data();
    const status = String(cnData?.status || '')
      .trim()
      .toLowerCase();
    if (status === 'cancelled' || status === 'voided') {
      throw new Error(
        `La nota de crédito ${cnData?.ncf || cnData?.number || note.id} está anulada y no puede aplicarse`,
      );
    }
    if (!['issued', 'applied'].includes(status)) {
      throw new Error(
        `La nota de crédito ${cnData?.ncf || cnData?.number || note.id} no está emitida y no puede aplicarse`,
      );
    }
    assertCreditNoteMatchesInvoice({
      creditNote: cnData,
      noteId: note.id,
      invoiceId,
      invoice: invoiceRecord,
    });
    assertCreditNoteFiscalStatusAllowsConsumption(cnData, note.id);
    if (!cnData?.ncf && !cnData?.eNcf) {
      throw new Error(
        `La nota de crédito ${cnData?.number || note.id} no tiene NCF/e-NCF emitido`,
      );
    }
    const currentAvailable = Number(
      cnData?.availableAmount ?? cnData?.totalAmount ?? 0,
    );
    const amountToConsume = Number(note.amountUsed);
    if (currentAvailable < amountToConsume) {
      throw new Error(
        `Saldo insuficiente en nota de crédito ${cnData?.ncf || cnData?.number || note.id}`,
      );
    }
    const newAvailable = currentAvailable - amountToConsume;

    creditNoteWrites.push({
      ref: cnRef,
      payload: {
        availableAmount: newAvailable,
        status: newAvailable === 0 ? 'fully_used' : 'applied',
        updatedAt: FieldValue.serverTimestamp(),
      },
    });

    const appRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('creditNoteApplications')
      .doc();

    const application = {
      id: appRef.id,
      creditNoteId: note.id,
      creditNoteNcf: note.ncf || cnData?.ncf || null,
      invoiceId,
      invoiceNcf,
      invoiceNumber,
      clientId:
        resolveClientRecordId(invoiceClient) || cnData?.client?.id || null,
      amountApplied: amountToConsume,
      previousBalance: currentAvailable,
      newBalance: newAvailable,
      appliedAt: FieldValue.serverTimestamp(),
      appliedBy: { uid: userId },
      createdAt: FieldValue.serverTimestamp(),
    };
    applicationWrites.push({ ref: appRef, payload: application });
    createdApplicationIds.push(appRef.id);
  }

  creditNoteWrites.forEach(({ ref, payload }) => {
    tx.update(ref, payload);
  });
  applicationWrites.forEach(({ ref, payload }) => {
    tx.set(ref, payload);
  });

  return { applicationIds: createdApplicationIds };
}
