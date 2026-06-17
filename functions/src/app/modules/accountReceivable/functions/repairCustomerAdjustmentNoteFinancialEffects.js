import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { buildClientPendingBalanceUpdate } from '../utils/clientPendingBalance.util.js';
import {
  canCreateFinancialEffectsForAdjustmentNote,
  isElectronicAdjustmentNote,
  resolveElectronicAdjustmentNoteFiscalStatus,
} from '../utils/customerAdjustmentNoteFiscalStatus.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const MAX_SCAN_LIMIT = 200;
const DEFAULT_SCAN_LIMIT = 100;
const MONEY_EPSILON = 0.01;
const CONFIRMED_REJECTION_STATUSES = new Set(['rejected']);
const AMBIGUOUS_FAILURE_STATUSES = new Set(['failed', 'error', 'local_failed']);

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

const clampLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SCAN_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_SCAN_LIMIT);
};

const resolveBusinessId = (payload) =>
  toCleanString(payload.businessId) || toCleanString(payload.businessID);

const resolveRepairDecision = (record, { ncfPrefix }) => {
  if (!isElectronicAdjustmentNote(record, { ncfPrefix }))
    return { status: 'skip' };
  if (canCreateFinancialEffectsForAdjustmentNote(record, { ncfPrefix })) {
    return { status: 'skip' };
  }

  const fiscalStatus = resolveElectronicAdjustmentNoteFiscalStatus(record);
  if (CONFIRMED_REJECTION_STATUSES.has(fiscalStatus)) {
    return { status: 'repair', fiscalStatus };
  }
  if (AMBIGUOUS_FAILURE_STATUSES.has(fiscalStatus)) {
    return { status: 'manual_review', fiscalStatus };
  }

  return { status: 'skip', fiscalStatus };
};

const normalizeNoteIdsForLookup = (noteIds) => {
  if (!Array.isArray(noteIds)) return null;

  const uniqueNoteIds = [
    ...new Set(noteIds.map(toCleanString).filter(Boolean)),
  ];
  if (uniqueNoteIds.length > MAX_SCAN_LIMIT) {
    throw new HttpsError(
      'invalid-argument',
      `No se pueden reparar mas de ${MAX_SCAN_LIMIT} documentos por tipo en una sola ejecucion.`,
    );
  }

  return uniqueNoteIds;
};

const mapDoc = (docSnap) => ({
  id: docSnap.id,
  data: asRecord(docSnap.data()),
});

const listCandidateNotes = async ({
  businessId,
  collectionName,
  noteIds,
  limit,
}) => {
  const normalizedNoteIds = normalizeNoteIdsForLookup(noteIds);
  if (normalizedNoteIds) {
    if (!normalizedNoteIds.length) return [];
    const snapshots = await Promise.all(
      normalizedNoteIds.map((noteId) =>
        db.doc(`businesses/${businessId}/${collectionName}/${noteId}`).get(),
      ),
    );
    return snapshots.filter((snap) => snap.exists).map(mapDoc);
  }

  const snap = await db
    .collection(`businesses/${businessId}/${collectionName}`)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(mapDoc);
};

const getSnapshot = (target, reader) =>
  reader ? reader.get(target) : target.get();

const getDocsByArId = async ({ businessId, collectionName, arId, reader }) => {
  if (!arId) return [];
  const query = db
    .collection(`businesses/${businessId}/${collectionName}`)
    .where('arId', '==', arId);
  const snap = await getSnapshot(query, reader);
  return snap.docs.map(mapDoc);
};

const getCreditNoteApplications = async ({
  businessId,
  creditNoteId,
  reader,
}) => {
  if (!creditNoteId) return [];
  const query = db
    .collection(`businesses/${businessId}/creditNoteApplications`)
    .where('creditNoteId', '==', creditNoteId);
  const snap = await getSnapshot(query, reader);
  return snap.docs.map(mapDoc);
};

const summarizeAccountingEffect = ({ eventSnap, entrySnap }) => ({
  accountingEventId: eventSnap?.exists ? eventSnap.id : null,
  accountingEventStatus: eventSnap?.exists
    ? toCleanString(eventSnap.data()?.status)
    : null,
  journalEntryId: entrySnap?.exists ? entrySnap.id : null,
  journalEntryStatus: entrySnap?.exists
    ? toCleanString(entrySnap.data()?.status)
    : null,
});

const buildPaymentStatePatch = ({ account, now }) => {
  const currentPaymentState = asRecord(account.paymentState);
  return {
    ...currentPaymentState,
    status: 'voided',
    total: roundToTwoDecimals(
      currentPaymentState.total ?? account.totalReceivable,
    ),
    paid: roundToTwoDecimals(currentPaymentState.paid ?? 0),
    balance: 0,
    remainingInstallments: 0,
    voidedAt: now,
    voidReason: 'rejected_electronic_adjustment_note',
  };
};

const buildManualFinding = ({ kind, noteId, ncf, reasons, details }) => ({
  kind,
  noteId,
  ncf,
  repairStatus: 'manual_review',
  reasons,
  details,
});

const buildAmbiguousFiscalFailureFinding = ({
  kind,
  noteId,
  note,
  fiscalStatus,
}) =>
  buildManualFinding({
    kind,
    noteId,
    ncf: note.ncf || note.eNcf || null,
    reasons: ['ambiguous_fiscal_failure'],
    details: {
      fiscalStatus,
    },
  });

const getInvoiceReceivableState = (invoice) =>
  asRecord(invoice.receivableState).arId
    ? asRecord(invoice.receivableState)
    : asRecord(asRecord(invoice.data).receivableState);

const buildDebitNoteContext = async ({ businessId, noteId, note, reader }) => {
  const noteRef = db.doc(`businesses/${businessId}/debitNotes/${noteId}`);
  const noteSnap = reader ? await reader.get(noteRef) : null;
  const activeNote = reader ? asRecord(noteSnap?.data()) : asRecord(note);
  const arId = toCleanString(activeNote.accountsReceivableId);
  const eventId = `customer_debit_note.issued__${noteId}`;
  const arRef = arId
    ? db.doc(`businesses/${businessId}/accountsReceivable/${arId}`)
    : null;
  const eventRef = db.doc(
    `businesses/${businessId}/accountingEvents/${eventId}`,
  );
  const entryRef = db.doc(`businesses/${businessId}/journalEntries/${eventId}`);

  const [
    arSnap,
    payments,
    installmentPayments,
    installments,
    eventSnap,
    entrySnap,
  ] = await Promise.all([
    arRef ? getSnapshot(arRef, reader) : null,
    getDocsByArId({
      businessId,
      collectionName: 'accountsReceivablePayments',
      arId,
      reader,
    }),
    getDocsByArId({
      businessId,
      collectionName: 'accountsReceivableInstallmentPayments',
      arId,
      reader,
    }),
    getDocsByArId({
      businessId,
      collectionName: 'accountsReceivableInstallments',
      arId,
      reader,
    }),
    getSnapshot(eventRef, reader),
    getSnapshot(entryRef, reader),
  ]);

  const ar = asRecord(arSnap?.data());
  const invoiceId = toCleanString(ar.invoiceId);
  const invoiceRef = invoiceId
    ? db.doc(`businesses/${businessId}/invoices/${invoiceId}`)
    : null;
  const clientId = toCleanString(ar.clientId);
  const clientRef = clientId
    ? db.doc(`businesses/${businessId}/clients/${clientId}`)
    : null;
  const [invoiceSnap, clientSnap] = await Promise.all([
    invoiceRef ? getSnapshot(invoiceRef, reader) : null,
    clientRef ? getSnapshot(clientRef, reader) : null,
  ]);

  return {
    activeNote,
    ar,
    arId,
    arRef,
    arSnap,
    clientRef,
    clientSnap,
    entryRef,
    entrySnap,
    eventRef,
    eventSnap,
    installments,
    installmentPayments,
    invoiceRef,
    invoiceSnap,
    noteRef,
    payments,
  };
};

const resolveDebitReceivableAmounts = (ar) => ({
  balance: roundToTwoDecimals(ar.paymentState?.balance ?? ar.arBalance),
  total: roundToTwoDecimals(ar.totalReceivable),
});

const buildDebitUnsafeReasons = ({
  ar,
  arId,
  arSnap,
  balance,
  entrySnap,
  installmentPayments,
  noteId,
  payments,
  total,
}) => {
  const unsafeReasons = [];
  if (entrySnap?.exists) unsafeReasons.push('journal_entry_exists');
  if (payments.length > 0) unsafeReasons.push('payments_exist');
  if (installmentPayments.length > 0) {
    unsafeReasons.push('installment_payments_exist');
  }
  if (arSnap?.exists && toCleanString(ar.debitNoteId) !== noteId) {
    unsafeReasons.push('receivable_not_owned_by_debit_note');
  }
  if (arSnap?.exists && Math.abs(balance - total) > MONEY_EPSILON) {
    unsafeReasons.push('receivable_balance_changed');
  }
  if (!arSnap?.exists && arId) {
    unsafeReasons.push('receivable_not_found');
  }

  return unsafeReasons;
};

const buildDebitSummary = ({
  arId,
  arSnap,
  balance,
  entrySnap,
  eventSnap,
  installments,
  installmentPayments,
  invoiceSnap,
  payments,
  total,
}) => ({
  arId,
  arExists: Boolean(arSnap?.exists),
  arBalance: arSnap?.exists ? balance : null,
  totalReceivable: arSnap?.exists ? total : null,
  invoiceReceivableStateArId: invoiceSnap?.exists
    ? toCleanString(
        getInvoiceReceivableState(asRecord(invoiceSnap.data())).arId,
      )
    : null,
  installments: installments.length,
  payments: payments.length,
  installmentPayments: installmentPayments.length,
  ...summarizeAccountingEffect({ eventSnap, entrySnap }),
});

const assessDebitRepair = ({ context, noteId }) => {
  const { balance, total } = resolveDebitReceivableAmounts(context.ar);
  const unsafeReasons = buildDebitUnsafeReasons({
    ...context,
    balance,
    noteId,
    total,
  });
  const summary = buildDebitSummary({
    ...context,
    balance,
    total,
  });

  return { balance, summary, total, unsafeReasons };
};

const buildCreditNoteContext = async ({ businessId, noteId, note, reader }) => {
  const noteRef = db.doc(`businesses/${businessId}/creditNotes/${noteId}`);
  const noteSnap = reader ? await reader.get(noteRef) : null;
  const activeNote = reader ? asRecord(noteSnap?.data()) : asRecord(note);
  const eventId = `customer_credit_note.issued__${noteId}`;
  const eventRef = db.doc(
    `businesses/${businessId}/accountingEvents/${eventId}`,
  );
  const entryRef = db.doc(`businesses/${businessId}/journalEntries/${eventId}`);
  const [applications, eventSnap, entrySnap] = await Promise.all([
    getCreditNoteApplications({ businessId, creditNoteId: noteId, reader }),
    getSnapshot(eventRef, reader),
    getSnapshot(entryRef, reader),
  ]);

  return {
    activeNote,
    applications,
    entryRef,
    entrySnap,
    eventRef,
    eventSnap,
    noteRef,
  };
};

const assessCreditRepair = ({ context }) => {
  const unsafeReasons = [];
  if (context.entrySnap.exists) unsafeReasons.push('journal_entry_exists');
  if (context.applications.length > 0) unsafeReasons.push('applications_exist');

  return {
    unsafeReasons,
    summary: {
      availableAmount: roundToTwoDecimals(
        context.activeNote.availableAmount ?? context.activeNote.totalAmount,
      ),
      applications: context.applications.length,
      ...summarizeAccountingEffect({
        eventSnap: context.eventSnap,
        entrySnap: context.entrySnap,
      }),
    },
  };
};

const repairDebitNote = async ({
  businessId,
  noteId,
  note,
  dryRun,
  authUid,
}) => {
  const initialContext = await buildDebitNoteContext({
    businessId,
    noteId,
    note,
  });
  const { summary, unsafeReasons } = assessDebitRepair({
    context: initialContext,
    noteId,
  });

  if (unsafeReasons.length > 0) {
    return buildManualFinding({
      kind: 'debitNote',
      noteId,
      ncf: note.ncf || note.eNcf || null,
      reasons: unsafeReasons,
      details: summary,
    });
  }

  if (dryRun) {
    return {
      kind: 'debitNote',
      noteId,
      ncf: note.ncf || note.eNcf || null,
      repairStatus: 'would_repair',
      details: summary,
    };
  }

  let transactionResult = null;
  await db.runTransaction(async (tx) => {
    const context = await buildDebitNoteContext({
      businessId,
      noteId,
      note,
      reader: tx,
    });
    const decision = resolveRepairDecision(context.activeNote, {
      ncfPrefix: 'E33',
    });
    const assessment = assessDebitRepair({ context, noteId });
    const transactionUnsafeReasons = [...assessment.unsafeReasons];
    if (decision.status !== 'repair') {
      transactionUnsafeReasons.push('note_not_confirmed_rejected');
    }

    if (transactionUnsafeReasons.length > 0) {
      transactionResult = buildManualFinding({
        kind: 'debitNote',
        noteId,
        ncf: context.activeNote.ncf || context.activeNote.eNcf || null,
        reasons: transactionUnsafeReasons,
        details: assessment.summary,
      });
      return;
    }

    const now = Timestamp.now();
    tx.set(
      context.noteRef,
      {
        status: 'electronic_failed',
        financialEffectsStatus: 'voided_rejected_fiscal',
        financialEffectsRepairedAt: now,
        financialEffectsRepairedBy: authUid,
        updatedAt: now,
        updatedBy: authUid,
      },
      { merge: true },
    );

    if (context.arSnap?.exists && context.arId) {
      tx.set(
        context.arRef,
        {
          arBalance: 0,
          isActive: false,
          isClosed: true,
          status: 'voided',
          paymentState: buildPaymentStatePatch({ account: context.ar, now }),
          voidedAt: now,
          voidedBy: authUid,
          voidReason: 'rejected_electronic_debit_note',
          updatedAt: now,
          updatedBy: authUid,
        },
        { merge: true },
      );

      context.installments.forEach((installment) => {
        tx.set(
          db.doc(
            `businesses/${businessId}/accountsReceivableInstallments/${installment.id}`,
          ),
          {
            installmentBalance: 0,
            isActive: false,
            status: 'voided',
            voidedAt: now,
            voidedBy: authUid,
            updatedAt: now,
            updatedBy: authUid,
          },
          { merge: true },
        );
      });

      if (context.invoiceSnap?.exists) {
        const receivableState = getInvoiceReceivableState(
          asRecord(context.invoiceSnap.data()),
        );
        if (toCleanString(receivableState.arId) === context.arId) {
          tx.set(
            context.invoiceRef,
            {
              receivableState: FieldValue.delete(),
              'data.receivableState': FieldValue.delete(),
              updatedAt: now,
              updatedBy: authUid,
            },
            { merge: true },
          );
        }
      }

      if (context.clientRef && assessment.balance > MONEY_EPSILON) {
        tx.set(
          context.clientRef,
          buildClientPendingBalanceUpdate({
            currentClientDoc: context.clientSnap?.exists
              ? context.clientSnap.data()
              : null,
            delta: -assessment.balance,
          }),
          { merge: true },
        );
      }
    }

    if (context.eventSnap?.exists) {
      tx.set(
        context.eventRef,
        {
          status: 'voided',
          voidedAt: now,
          voidedBy: authUid,
          voidReason: 'rejected_electronic_debit_note',
          updatedAt: now,
        },
        { merge: true },
      );
    }

    transactionResult = {
      kind: 'debitNote',
      noteId,
      ncf: context.activeNote.ncf || context.activeNote.eNcf || null,
      repairStatus: 'repaired',
      details: assessment.summary,
    };
  });

  return transactionResult;
};

const repairCreditNote = async ({
  businessId,
  noteId,
  note,
  dryRun,
  authUid,
}) => {
  const initialContext = await buildCreditNoteContext({
    businessId,
    noteId,
    note,
  });
  const { summary, unsafeReasons } = assessCreditRepair({
    context: initialContext,
  });

  if (unsafeReasons.length > 0) {
    return buildManualFinding({
      kind: 'creditNote',
      noteId,
      ncf: note.ncf || note.eNcf || null,
      reasons: unsafeReasons,
      details: summary,
    });
  }

  if (dryRun) {
    return {
      kind: 'creditNote',
      noteId,
      ncf: note.ncf || note.eNcf || null,
      repairStatus: 'would_repair',
      details: summary,
    };
  }

  let transactionResult = null;
  await db.runTransaction(async (tx) => {
    const context = await buildCreditNoteContext({
      businessId,
      noteId,
      note,
      reader: tx,
    });
    const decision = resolveRepairDecision(context.activeNote, {
      ncfPrefix: 'E34',
    });
    const assessment = assessCreditRepair({ context });
    const transactionUnsafeReasons = [...assessment.unsafeReasons];
    if (decision.status !== 'repair') {
      transactionUnsafeReasons.push('note_not_confirmed_rejected');
    }

    if (transactionUnsafeReasons.length > 0) {
      transactionResult = buildManualFinding({
        kind: 'creditNote',
        noteId,
        ncf: context.activeNote.ncf || context.activeNote.eNcf || null,
        reasons: transactionUnsafeReasons,
        details: assessment.summary,
      });
      return;
    }

    const now = Timestamp.now();
    tx.set(
      context.noteRef,
      {
        status: 'electronic_failed',
        availableAmount: 0,
        financialEffectsStatus: 'voided_rejected_fiscal',
        financialEffectsRepairedAt: now,
        financialEffectsRepairedBy: authUid,
        updatedAt: now,
        updatedBy: authUid,
      },
      { merge: true },
    );

    if (context.eventSnap.exists) {
      tx.set(
        context.eventRef,
        {
          status: 'voided',
          voidedAt: now,
          voidedBy: authUid,
          voidReason: 'rejected_electronic_credit_note',
          updatedAt: now,
        },
        { merge: true },
      );
    }

    transactionResult = {
      kind: 'creditNote',
      noteId,
      ncf: context.activeNote.ncf || context.activeNote.eNcf || null,
      repairStatus: 'repaired',
      details: assessment.summary,
    };
  });

  return transactionResult;
};

export const repairRejectedAdjustmentNoteFinancialEffects = async ({
  businessId,
  noteIds = {},
  types = ['credit', 'debit'],
  limit = DEFAULT_SCAN_LIMIT,
  dryRun = true,
  authUid = 'system',
} = {}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const normalizedTypes = new Set(
    (Array.isArray(types) ? types : [types]).map(toCleanString).filter(Boolean),
  );
  const scanLimit = clampLimit(limit);
  const results = [];

  if (normalizedTypes.has('debit') || normalizedTypes.has('all')) {
    const debitNotes = await listCandidateNotes({
      businessId: normalizedBusinessId,
      collectionName: 'debitNotes',
      noteIds: asRecord(noteIds).debit,
      limit: scanLimit,
    });
    for (const { id, data } of debitNotes) {
      const decision = resolveRepairDecision(data, { ncfPrefix: 'E33' });
      if (decision.status === 'manual_review') {
        results.push(
          buildAmbiguousFiscalFailureFinding({
            kind: 'debitNote',
            noteId: id,
            note: data,
            fiscalStatus: decision.fiscalStatus,
          }),
        );
        continue;
      }
      if (decision.status !== 'repair') {
        continue;
      }
      results.push(
        await repairDebitNote({
          businessId: normalizedBusinessId,
          noteId: id,
          note: data,
          dryRun,
          authUid,
        }),
      );
    }
  }

  if (normalizedTypes.has('credit') || normalizedTypes.has('all')) {
    const creditNotes = await listCandidateNotes({
      businessId: normalizedBusinessId,
      collectionName: 'creditNotes',
      noteIds: asRecord(noteIds).credit,
      limit: scanLimit,
    });
    for (const { id, data } of creditNotes) {
      const decision = resolveRepairDecision(data, { ncfPrefix: 'E34' });
      if (decision.status === 'manual_review') {
        results.push(
          buildAmbiguousFiscalFailureFinding({
            kind: 'creditNote',
            noteId: id,
            note: data,
            fiscalStatus: decision.fiscalStatus,
          }),
        );
        continue;
      }
      if (decision.status !== 'repair') {
        continue;
      }
      results.push(
        await repairCreditNote({
          businessId: normalizedBusinessId,
          noteId: id,
          note: data,
          dryRun,
          authUid,
        }),
      );
    }
  }

  const counts = results.reduce((accumulator, result) => {
    accumulator[result.repairStatus] =
      (accumulator[result.repairStatus] || 0) + 1;
    return accumulator;
  }, {});

  return {
    ok: true,
    businessId: normalizedBusinessId,
    dryRun: Boolean(dryRun),
    counts,
    results,
  };
};

export const repairCustomerAdjustmentNoteFinancialEffects = onCall(
  {
    cors: true,
    invoker: 'public',
    region: REGION,
    memory: MEMORY,
  },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
    });

    return repairRejectedAdjustmentNoteFinancialEffects({
      businessId,
      noteIds: asRecord(payload.noteIds),
      types: payload.types || payload.type || ['credit', 'debit'],
      limit: payload.limit,
      dryRun: payload.dryRun !== false,
      authUid,
    });
  },
);
