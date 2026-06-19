import { https } from 'firebase-functions';

import { db, FieldValue } from '../../../core/config/firebase.js';

export const CASH_COUNT_SALE_SCHEMA_VERSION = 1;

const toCleanString = (value) =>
  typeof value === 'string' ? value.trim() : '';

const getRefId = (ref) => toCleanString(ref?.id) || ref?.path?.split('/').pop();

const assertDocumentId = (value, fieldName) => {
  const cleanValue = toCleanString(value);
  if (!cleanValue || cleanValue.includes('/')) {
    throw new https.HttpsError(
      'invalid-argument',
      `${fieldName} debe ser un ID de documento valido`,
    );
  }
  return cleanValue;
};

const assertTransaction = (tx) => {
  if (!tx || typeof tx.get !== 'function' || typeof tx.set !== 'function') {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere una transaccion de Firestore valida',
    );
  }

  if (typeof tx.update !== 'function') {
    throw new https.HttpsError(
      'invalid-argument',
      'La transaccion debe permitir update',
    );
  }
};

const assertDeleteCapableTransaction = (tx) => {
  assertTransaction(tx);
  if (typeof tx.delete !== 'function') {
    throw new https.HttpsError(
      'invalid-argument',
      'La transaccion debe permitir delete',
    );
  }
};

const normalizeSource = (source) => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  return {
    type: toCleanString(source.type) || null,
    taskId: toCleanString(source.taskId) || null,
    attemptId: toCleanString(source.attemptId) || null,
  };
};

const hasInvoiceRef = (sales, invoiceRef) =>
  Array.isArray(sales) &&
  sales.some((saleRef) => saleRef?.path && saleRef.path === invoiceRef.path);

const getCashCountSales = (cashCountSnap) => {
  if (typeof cashCountSnap?.get === 'function') {
    const nestedSales = cashCountSnap.get('cashCount.sales');
    if (Array.isArray(nestedSales)) {
      return nestedSales;
    }
  }

  return cashCountSnap?.data?.()?.cashCount?.sales || [];
};

export function buildCashCountSaleReadModelId({ cashCountId, invoiceId }) {
  return `${assertDocumentId(cashCountId, 'cashCountId')}__${assertDocumentId(
    invoiceId,
    'invoiceId',
  )}`;
}

export function buildCashCountSaleRefs({
  businessId,
  cashCountId,
  invoiceId,
  cashCountRef = null,
  invoiceRef = null,
}) {
  const cleanBusinessId = assertDocumentId(businessId, 'businessId');
  const cleanCashCountId = assertDocumentId(
    cashCountId || getRefId(cashCountRef),
    'cashCountId',
  );
  const cleanInvoiceId = assertDocumentId(
    invoiceId || getRefId(invoiceRef),
    'invoiceId',
  );
  const resolvedCashCountRef =
    cashCountRef ||
    db.doc(`businesses/${cleanBusinessId}/cashCounts/${cleanCashCountId}`);
  const resolvedInvoiceRef =
    invoiceRef ||
    db.doc(`businesses/${cleanBusinessId}/invoices/${cleanInvoiceId}`);
  const saleRef = db.doc(
    `businesses/${cleanBusinessId}/cashCounts/${cleanCashCountId}/sales/${cleanInvoiceId}`,
  );
  const readModelId = buildCashCountSaleReadModelId({
    cashCountId: cleanCashCountId,
    invoiceId: cleanInvoiceId,
  });
  const readModelRef = db.doc(
    `businesses/${cleanBusinessId}/cashCountSales/${readModelId}`,
  );

  return {
    businessId: cleanBusinessId,
    cashCountId: cleanCashCountId,
    invoiceId: cleanInvoiceId,
    cashCountRef: resolvedCashCountRef,
    invoiceRef: resolvedInvoiceRef,
    saleRef,
    readModelId,
    readModelRef,
  };
}

export function buildCashCountSaleDocument({
  businessId,
  cashCountId,
  invoiceId,
  cashCountRef,
  invoiceRef,
  saleRef,
  readModelId,
  createdBy = null,
  source = null,
}) {
  const timestamp = FieldValue.serverTimestamp();

  return {
    schemaVersion: CASH_COUNT_SALE_SCHEMA_VERSION,
    businessId,
    cashCountId,
    invoiceId,
    cashCountRef,
    cashCountPath: cashCountRef.path,
    invoiceRef,
    invoicePath: invoiceRef.path,
    saleRef,
    salePath: saleRef.path,
    readModelId,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: toCleanString(createdBy) || null,
    source: normalizeSource(source),
  };
}

export async function linkSaleToCashCountInTransaction({
  tx,
  businessId,
  cashCountId,
  invoiceId,
  cashCountRef = null,
  invoiceRef = null,
  cashCountSnap = null,
  writeReadModel = true,
  createdBy = null,
  source = null,
}) {
  assertTransaction(tx);

  const refs = buildCashCountSaleRefs({
    businessId,
    cashCountId,
    invoiceId,
    cashCountRef,
    invoiceRef,
  });

  const resolvedCashCountSnap =
    cashCountSnap || (await tx.get(refs.cashCountRef));
  const saleSnap = await tx.get(refs.saleRef);
  const readModelSnap = writeReadModel ? await tx.get(refs.readModelRef) : null;

  if (!resolvedCashCountSnap?.exists) {
    throw new https.HttpsError(
      'not-found',
      `CashCount ${refs.cashCountId} no existe`,
    );
  }

  const alreadyInLegacy = hasInvoiceRef(
    getCashCountSales(resolvedCashCountSnap),
    refs.invoiceRef,
  );
  const saleExists = Boolean(saleSnap?.exists);
  const readModelExists = Boolean(readModelSnap?.exists);
  const saleDocument = buildCashCountSaleDocument({
    ...refs,
    createdBy,
    source,
  });

  if (!alreadyInLegacy) {
    tx.update(refs.cashCountRef, {
      'cashCount.sales': FieldValue.arrayUnion(refs.invoiceRef),
    });
  }

  if (!saleExists) {
    tx.set(refs.saleRef, saleDocument, { merge: false });
  }

  if (writeReadModel && !readModelExists) {
    tx.set(
      refs.readModelRef,
      {
        ...saleDocument,
        id: refs.readModelId,
      },
      { merge: false },
    );
  }

  return {
    businessId: refs.businessId,
    cashCountId: refs.cashCountId,
    invoiceId: refs.invoiceId,
    salePath: refs.saleRef.path,
    readModelId: writeReadModel ? refs.readModelId : null,
    readModelPath: writeReadModel ? refs.readModelRef.path : null,
    legacyPatched: !alreadyInLegacy,
    saleCreated: !saleExists,
    readModelCreated: writeReadModel ? !readModelExists : false,
    alreadyLinked:
      alreadyInLegacy && saleExists && (!writeReadModel || readModelExists),
  };
}

export async function linkSaleToCashCount(params) {
  return db.runTransaction((tx) =>
    linkSaleToCashCountInTransaction({
      ...params,
      tx,
    }),
  );
}

export function upsertSaleToCashCountInTransaction({
  tx,
  businessId,
  cashCountId,
  invoiceId,
  cashCountRef = null,
  invoiceRef = null,
  cashCountSnap = null,
  writeReadModel = true,
  createdBy = null,
  source = null,
}) {
  assertTransaction(tx);

  const refs = buildCashCountSaleRefs({
    businessId,
    cashCountId,
    invoiceId,
    cashCountRef,
    invoiceRef,
  });

  if (!cashCountSnap?.exists) {
    throw new https.HttpsError(
      'not-found',
      `CashCount ${refs.cashCountId} no existe`,
    );
  }

  const alreadyInLegacy = hasInvoiceRef(
    getCashCountSales(cashCountSnap),
    refs.invoiceRef,
  );
  const saleDocument = buildCashCountSaleDocument({
    ...refs,
    createdBy,
    source,
  });

  if (!alreadyInLegacy) {
    tx.update(refs.cashCountRef, {
      'cashCount.sales': FieldValue.arrayUnion(refs.invoiceRef),
    });
  }

  tx.set(refs.saleRef, saleDocument, { merge: true });

  if (writeReadModel) {
    tx.set(
      refs.readModelRef,
      {
        ...saleDocument,
        id: refs.readModelId,
      },
      { merge: true },
    );
  }

  return {
    businessId: refs.businessId,
    cashCountId: refs.cashCountId,
    invoiceId: refs.invoiceId,
    salePath: refs.saleRef.path,
    readModelId: writeReadModel ? refs.readModelId : null,
    readModelPath: writeReadModel ? refs.readModelRef.path : null,
    legacyPatched: !alreadyInLegacy,
    saleUpserted: true,
    readModelUpserted: writeReadModel,
  };
}

export function unlinkSaleFromCashCountInTransaction({
  tx,
  businessId,
  cashCountId,
  invoiceId,
  cashCountRef = null,
  invoiceRef = null,
  removeLegacy = true,
  removeReadModel = true,
} = {}) {
  assertDeleteCapableTransaction(tx);

  const refs = buildCashCountSaleRefs({
    businessId,
    cashCountId,
    invoiceId,
    cashCountRef,
    invoiceRef,
  });

  if (removeLegacy) {
    tx.update(refs.cashCountRef, {
      'cashCount.sales': FieldValue.arrayRemove(refs.invoiceRef),
    });
  }
  tx.delete(refs.saleRef);
  if (removeReadModel) {
    tx.delete(refs.readModelRef);
  }

  return {
    businessId: refs.businessId,
    cashCountId: refs.cashCountId,
    invoiceId: refs.invoiceId,
    salePath: refs.saleRef.path,
    readModelId: removeReadModel ? refs.readModelId : null,
    readModelPath: removeReadModel ? refs.readModelRef.path : null,
    legacyRemoved: removeLegacy,
    saleRemoved: true,
    readModelRemoved: removeReadModel,
  };
}
