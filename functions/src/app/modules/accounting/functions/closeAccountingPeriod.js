import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { CloseAccountingPeriodInputSchema } from '../../../../shared/accountingSchemas.js';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  buildJournalEntry,
  isJournalEntryBalanced,
  roundJournalAmount,
} from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import { parseSchemaOrThrow } from '../utils/zodHttps.util.js';

const MAX_BLOCKER_EXAMPLES = 10;
const CLOSING_THRESHOLD = 0.01;
const VOIDED_ACCOUNTING_EVENT_STATUSES = new Set(['voided']);
const BLOCKING_DEAD_LETTER_STATUSES = new Set([
  'failed',
  'pending',
  'pending_account_mapping',
]);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const parsePeriodRange = (periodKey) => {
  const [year, month] = periodKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { end, start };
};

const parsePeriodParts = (periodKey) => {
  const [year, month] = periodKey.split('-').map(Number);
  return { month, year };
};

const parseFiscalYearRange = (year) => ({
  end: new Date(Date.UTC(year + 1, 0, 1)),
  start: new Date(Date.UTC(year, 0, 1)),
});

const mapSnapshotDocs = (snapshot) =>
  Array.isArray(snapshot?.docs)
    ? snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...asRecord(docSnapshot.data()),
      }))
    : [];

const resolveEventProjectionStatus = (event) => {
  const projection = asRecord(event.projection);
  return (
    toCleanString(projection.status) ||
    toCleanString(event.projectionStatus) ||
    'pending'
  );
};

const resolveEventJournalEntryId = (event) => {
  const projection = asRecord(event.projection);
  const metadata = asRecord(event.metadata);
  return (
    toCleanString(projection.journalEntryId) ||
    toCleanString(event.journalEntryId) ||
    toCleanString(metadata.journalEntryId)
  );
};

const loadProjectionDeadLetters = async ({ businessId }) => {
  const deadLettersSnap = await db
    .collection(`businesses/${businessId}/accountingEventProjectionDeadLetters`)
    .get();
  return mapSnapshotDocs(deadLettersSnap).filter((deadLetter) =>
    BLOCKING_DEAD_LETTER_STATUSES.has(
      toCleanString(deadLetter.projectionStatus) ?? 'pending',
    ),
  );
};

const loadPeriodClosureBlockers = async ({ businessId, periodKey }) => {
  const { end, start } = parsePeriodRange(periodKey);
  const [eventsSnap, journalEntriesSnap, deadLetters] = await Promise.all([
    db
      .collection(`businesses/${businessId}/accountingEvents`)
      .where('occurredAt', '>=', start)
      .where('occurredAt', '<', end)
      .get(),
    db
      .collection(`businesses/${businessId}/journalEntries`)
      .where('periodKey', '==', periodKey)
      .get(),
    loadProjectionDeadLetters({ businessId }),
  ]);

  const accountingEvents = mapSnapshotDocs(eventsSnap).filter(
    (event) =>
      !VOIDED_ACCOUNTING_EVENT_STATUSES.has(toCleanString(event.status)),
  );
  const journalEntries = mapSnapshotDocs(journalEntriesSnap);
  const unresolvedEvents = accountingEvents.filter((event) => {
    const projectionStatus = resolveEventProjectionStatus(event);
    if (projectionStatus !== 'projected') {
      return true;
    }

    return !resolveEventJournalEntryId(event);
  });
  const unbalancedEntries = journalEntries.filter(
    (entry) => !isJournalEntryBalanced(entry),
  );

  return {
    accountingEventCount: accountingEvents.length,
    deadLetters,
    journalEntryCount: journalEntries.length,
    unresolvedEvents,
    unbalancedEntries,
  };
};

const loadFiscalYearClosureBlockers = async ({ businessId, year }) => {
  const { end, start } = parseFiscalYearRange(year);
  const [eventsSnap, journalEntriesSnap, deadLetters] = await Promise.all([
    db
      .collection(`businesses/${businessId}/accountingEvents`)
      .where('occurredAt', '>=', start)
      .where('occurredAt', '<', end)
      .get(),
    db
      .collection(`businesses/${businessId}/journalEntries`)
      .where('periodKey', '>=', `${year}-01`)
      .where('periodKey', '<=', `${year}-12`)
      .get(),
    loadProjectionDeadLetters({ businessId }),
  ]);

  const accountingEvents = mapSnapshotDocs(eventsSnap).filter(
    (event) =>
      !VOIDED_ACCOUNTING_EVENT_STATUSES.has(toCleanString(event.status)),
  );
  const journalEntries = mapSnapshotDocs(journalEntriesSnap);
  const unresolvedEvents = accountingEvents.filter((event) => {
    const projectionStatus = resolveEventProjectionStatus(event);
    if (projectionStatus !== 'projected') {
      return true;
    }

    return !resolveEventJournalEntryId(event);
  });
  const unbalancedEntries = journalEntries.filter(
    (entry) => !isJournalEntryBalanced(entry),
  );

  return {
    accountingEventCount: accountingEvents.length,
    deadLetters,
    journalEntryCount: journalEntries.length,
    unresolvedEvents,
    unbalancedEntries,
  };
};

const assertPeriodCanBeClosed = async ({ businessId, periodKey }) => {
  const blockers = await loadPeriodClosureBlockers({ businessId, periodKey });
  if (
    !blockers.unresolvedEvents.length &&
    !blockers.unbalancedEntries.length &&
    !blockers.deadLetters.length
  ) {
    return blockers;
  }

  throw new HttpsError(
    'failed-precondition',
    'No se puede cerrar el periodo porque quedan validaciones contables pendientes.',
    {
      accountingEventCount: blockers.accountingEventCount,
      deadLetterCount: blockers.deadLetters.length,
      journalEntryCount: blockers.journalEntryCount,
      unresolvedEventCount: blockers.unresolvedEvents.length,
      unbalancedJournalEntryCount: blockers.unbalancedEntries.length,
      unresolvedEvents: blockers.unresolvedEvents
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((event) => ({
          id: event.id,
          eventType: toCleanString(event.eventType),
          projectionStatus: resolveEventProjectionStatus(event),
          journalEntryId: resolveEventJournalEntryId(event),
        })),
      unbalancedJournalEntries: blockers.unbalancedEntries
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((entry) => ({
          id: entry.id,
          eventId: toCleanString(entry.eventId),
          totals: asRecord(entry.totals),
        })),
      deadLetters: blockers.deadLetters
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((deadLetter) => ({
          id: deadLetter.id,
          eventId: toCleanString(deadLetter.eventId),
          eventType: toCleanString(deadLetter.eventType),
          projectionStatus: toCleanString(deadLetter.projectionStatus),
        })),
    },
  );
};

const assertFiscalYearCanBeClosed = async ({ businessId, year }) => {
  const blockers = await loadFiscalYearClosureBlockers({ businessId, year });
  if (
    !blockers.unresolvedEvents.length &&
    !blockers.unbalancedEntries.length &&
    !blockers.deadLetters.length
  ) {
    return blockers;
  }

  throw new HttpsError(
    'failed-precondition',
    'No se puede cerrar el ejercicio porque quedan validaciones contables pendientes en el año.',
    {
      accountingEventCount: blockers.accountingEventCount,
      deadLetterCount: blockers.deadLetters.length,
      fiscalYear: year,
      journalEntryCount: blockers.journalEntryCount,
      unresolvedEventCount: blockers.unresolvedEvents.length,
      unbalancedJournalEntryCount: blockers.unbalancedEntries.length,
      unresolvedEvents: blockers.unresolvedEvents
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((event) => ({
          id: event.id,
          eventType: toCleanString(event.eventType),
          projectionStatus: resolveEventProjectionStatus(event),
          journalEntryId: resolveEventJournalEntryId(event),
        })),
      unbalancedJournalEntries: blockers.unbalancedEntries
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((entry) => ({
          id: entry.id,
          eventId: toCleanString(entry.eventId),
          totals: asRecord(entry.totals),
        })),
      deadLetters: blockers.deadLetters
        .slice(0, MAX_BLOCKER_EXAMPLES)
        .map((deadLetter) => ({
          id: deadLetter.id,
          eventId: toCleanString(deadLetter.eventId),
          eventType: toCleanString(deadLetter.eventType),
          projectionStatus: toCleanString(deadLetter.projectionStatus),
        })),
    },
  );
};

const isFiscalYearEndPeriod = (periodKey) =>
  parsePeriodParts(periodKey).month === 12;

const assertFiscalYearCloseConfirmed = ({
  confirmFiscalYearClose,
  periodKey,
  year,
}) => {
  if (!isFiscalYearEndPeriod(periodKey) || confirmFiscalYearClose === true) {
    return;
  }

  throw new HttpsError(
    'failed-precondition',
    'El periodo corresponde al cierre fiscal anual. Confirma explícitamente el cierre del ejercicio enero-diciembre antes de continuar.',
    {
      fiscalYear: year,
      fiscalYearAssumption: 'jan_dec',
      periodKey,
      requiredFlag: 'confirmFiscalYearClose',
    },
  );
};

const shouldSkipEntryFromFiscalClose = (entry) => {
  const metadata = asRecord(entry.metadata);
  return (
    toCleanString(metadata.closingType) === 'fiscal_year' ||
    toCleanString(entry.sourceType) === 'fiscal_year_close'
  );
};

const resolveFiscalYearCloseEntryId = (year) => `fiscal_year_close__${year}`;

const resolveFiscalYearCloseEventId = (year) =>
  `manual.entry.recorded__${resolveFiscalYearCloseEntryId(year)}`;

const loadFiscalYearCloseContext = async ({ businessId, year }) => {
  const [accountsSnap, entriesSnap] = await Promise.all([
    db.collection(`businesses/${businessId}/chartOfAccounts`).get(),
    db
      .collection(`businesses/${businessId}/journalEntries`)
      .where('periodKey', '>=', `${year}-01`)
      .where('periodKey', '<=', `${year}-12`)
      .get(),
  ]);
  const accounts = mapSnapshotDocs(accountsSnap);
  const accountsById = new Map(
    accounts.map((account) => [account.id, account]),
  );
  const retainedEarningsAccount =
    accounts.find(
      (account) =>
        toCleanString(account.systemKey) === 'retained_earnings' &&
        toCleanString(account.status) !== 'inactive' &&
        account.postingAllowed !== false,
    ) ?? null;
  const closingAccountsById = new Map(
    accounts
      .filter((account) => {
        const type = toCleanString(account.type);
        return (
          (type === 'income' || type === 'expense') &&
          toCleanString(account.status) !== 'inactive' &&
          account.postingAllowed !== false
        );
      })
      .map((account) => [account.id, account]),
  );
  const balancesByAccountId = new Map();

  mapSnapshotDocs(entriesSnap)
    .filter((entry) => {
      const periodKey = toCleanString(entry.periodKey);
      return (
        periodKey >= `${year}-01` &&
        periodKey <= `${year}-12` &&
        toCleanString(entry.status) !== 'reversed' &&
        !shouldSkipEntryFromFiscalClose(entry)
      );
    })
    .forEach((entry) => {
      (Array.isArray(entry.lines) ? entry.lines : []).forEach((line) => {
        const accountId = toCleanString(line?.accountId);
        const account = accountId ? closingAccountsById.get(accountId) : null;
        if (!account) {
          return;
        }

        const debit = roundJournalAmount(line?.debit);
        const credit = roundJournalAmount(line?.credit);
        const previous = balancesByAccountId.get(account.id) ?? 0;
        const movement =
          toCleanString(account.type) === 'income'
            ? credit - debit
            : debit - credit;
        balancesByAccountId.set(
          account.id,
          roundJournalAmount(previous + movement),
        );
      });
    });

  const closingLines = Array.from(balancesByAccountId.entries())
    .map(([accountId, balance]) => {
      const account = accountsById.get(accountId);
      if (!account || Math.abs(balance) <= CLOSING_THRESHOLD) {
        return null;
      }

      const accountType = toCleanString(account.type);
      const positiveDebit =
        (accountType === 'income' && balance > 0) ||
        (accountType === 'expense' && balance < 0);
      const amount = roundJournalAmount(Math.abs(balance));

      return {
        accountId,
        accountCode: toCleanString(account.code),
        accountName: toCleanString(account.name),
        accountSystemKey: toCleanString(account.systemKey),
        description: `Cierre de resultados ${year}`,
        debit: positiveDebit ? amount : 0,
        credit: positiveDebit ? 0 : amount,
        reference: resolveFiscalYearCloseEntryId(year),
        metadata: {
          closingType: 'fiscal_year',
          fiscalYear: year,
        },
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      String(left.accountCode ?? '').localeCompare(
        String(right.accountCode ?? ''),
      ),
    );

  if (!closingLines.length) {
    return {
      entryNeeded: false,
      lines: [],
      netIncome: 0,
      retainedEarningsAccount: null,
    };
  }

  if (!retainedEarningsAccount) {
    throw new HttpsError(
      'failed-precondition',
      'No se encontró una cuenta activa de resultados acumulados para cerrar el ejercicio.',
    );
  }

  const totals = closingLines.reduce(
    (accumulator, line) => ({
      debit: roundJournalAmount(accumulator.debit + line.debit),
      credit: roundJournalAmount(accumulator.credit + line.credit),
    }),
    { debit: 0, credit: 0 },
  );
  const difference = roundJournalAmount(totals.debit - totals.credit);
  if (Math.abs(difference) > CLOSING_THRESHOLD) {
    closingLines.push({
      accountId: retainedEarningsAccount.id,
      accountCode: toCleanString(retainedEarningsAccount.code),
      accountName: toCleanString(retainedEarningsAccount.name),
      accountSystemKey: toCleanString(retainedEarningsAccount.systemKey),
      description: `Resultado neto ${year}`,
      debit: difference < 0 ? Math.abs(difference) : 0,
      credit: difference > 0 ? difference : 0,
      reference: resolveFiscalYearCloseEntryId(year),
      metadata: {
        closingType: 'fiscal_year',
        fiscalYear: year,
      },
    });
  }

  return {
    entryNeeded: true,
    lines: closingLines.map((line, index) => ({
      ...line,
      lineNumber: index + 1,
    })),
    netIncome: roundJournalAmount(difference),
    retainedEarningsAccount,
  };
};

const buildFiscalYearCloseDocuments = ({
  accountingSettings,
  authUid,
  businessId,
  closeContext,
  now,
  year,
}) => {
  const entryId = resolveFiscalYearCloseEntryId(year);
  const entryDate = Timestamp.fromDate(new Date(Date.UTC(year, 11, 31, 12)));
  const currency = accountingSettings?.functionalCurrency ?? 'DOP';
  const accountingEvent = buildAccountingEvent({
    businessId,
    eventType: 'manual.entry.recorded',
    status: 'projected',
    sourceType: 'fiscal_year_close',
    sourceId: entryId,
    sourceDocumentType: 'journalEntry',
    sourceDocumentId: entryId,
    currency,
    functionalCurrency: currency,
    payload: {
      description: `Cierre de resultados ${year}`,
      entryOrigin: 'fiscal_year_close',
      fiscalYear: year,
      lineCount: closeContext.lines.length,
      netIncome: closeContext.netIncome,
    },
    projection: {
      status: 'projected',
      journalEntryId: entryId,
      lastAttemptAt: now,
      projectedAt: now,
    },
    occurredAt: entryDate,
    recordedAt: now,
    createdAt: now,
    createdBy: authUid,
    metadata: {
      closingType: 'fiscal_year',
      fiscalYear: year,
    },
  });
  const entry = buildJournalEntry({
    businessId,
    entryId,
    event: accountingEvent,
    entryDate,
    description: `Cierre de resultados ${year}`,
    currency,
    functionalCurrency: currency,
    sourceType: 'fiscal_year_close',
    sourceId: entryId,
    lines: closeContext.lines,
    createdAt: now,
    createdBy: authUid,
    metadata: {
      closingType: 'fiscal_year',
      fiscalYear: year,
      netIncome: closeContext.netIncome,
    },
  });

  return { accountingEvent, entry, entryId };
};

export const closeAccountingPeriod = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const { businessId, confirmFiscalYearClose, periodKey, note } =
      parseSchemaOrThrow(
        CloseAccountingPeriodInputSchema,
        {
          businessId:
            toCleanString(payload.businessId) ||
            toCleanString(payload.businessID) ||
            null,
          confirmFiscalYearClose: payload.confirmFiscalYearClose === true,
          periodKey: toCleanString(payload.periodKey),
          note: toCleanString(payload.note),
        },
        'No se pudo validar el cierre del periodo.',
      );

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_ADMIN,
    });

    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
      businessId,
      accountingSettings,
    );
    if (
      !rolloutEnabled ||
      accountingSettings?.generalAccountingEnabled !== true
    ) {
      throw new HttpsError(
        'failed-precondition',
        'La contabilidad general no está habilitada para este negocio.',
      );
    }

    await assertPeriodCanBeClosed({ businessId, periodKey });

    const { year } = parsePeriodParts(periodKey);
    assertFiscalYearCloseConfirmed({ confirmFiscalYearClose, periodKey, year });
    const shouldCloseFiscalYear = isFiscalYearEndPeriod(periodKey);
    let fiscalYearCloseContext = null;
    if (shouldCloseFiscalYear) {
      await assertFiscalYearCanBeClosed({ businessId, year });
      fiscalYearCloseContext = await loadFiscalYearCloseContext({
        businessId,
        year,
      });
    }

    const closureRef = db.doc(
      `businesses/${businessId}/accountingPeriodClosures/${periodKey}`,
    );
    const fiscalYearCloseEntryId = shouldCloseFiscalYear
      ? resolveFiscalYearCloseEntryId(year)
      : null;
    const fiscalYearCloseEntryRef =
      fiscalYearCloseEntryId && fiscalYearCloseContext?.entryNeeded
        ? db.doc(
            `businesses/${businessId}/journalEntries/${fiscalYearCloseEntryId}`,
          )
        : null;
    const fiscalYearCloseEventRef =
      fiscalYearCloseEntryId && fiscalYearCloseContext?.entryNeeded
        ? db.doc(
            `businesses/${businessId}/accountingEvents/${resolveFiscalYearCloseEventId(year)}`,
          )
        : null;

    let result = null;

    await db.runTransaction(async (transaction) => {
      const [closureSnap, fiscalYearCloseEntrySnap] = await Promise.all([
        transaction.get(closureRef),
        fiscalYearCloseEntryRef
          ? transaction.get(fiscalYearCloseEntryRef)
          : Promise.resolve(null),
      ]);
      if (closureSnap.exists) {
        result = {
          ok: true,
          periodKey,
          reused: true,
          ...(shouldCloseFiscalYear
            ? {
                fiscalYearCloseEntryId: fiscalYearCloseEntrySnap?.exists
                  ? fiscalYearCloseEntryId
                  : null,
                fiscalYearCloseReused:
                  fiscalYearCloseEntrySnap?.exists === true,
              }
            : {}),
        };
        return;
      }

      const now = Timestamp.now();
      let fiscalYearCloseCreated = false;
      let fiscalYearCloseReused = false;
      if (
        fiscalYearCloseContext?.entryNeeded &&
        fiscalYearCloseEntryRef &&
        fiscalYearCloseEventRef
      ) {
        if (fiscalYearCloseEntrySnap?.exists) {
          fiscalYearCloseReused = true;
        } else {
          const { accountingEvent, entry } = buildFiscalYearCloseDocuments({
            accountingSettings,
            authUid,
            businessId,
            closeContext: fiscalYearCloseContext,
            now,
            year,
          });
          transaction.set(fiscalYearCloseEventRef, accountingEvent);
          transaction.set(fiscalYearCloseEntryRef, entry);
          fiscalYearCloseCreated = true;
        }
      }

      transaction.set(closureRef, {
        id: periodKey,
        businessId,
        periodKey,
        status: 'closed',
        note: note ?? null,
        closedAt: now,
        closedBy: authUid,
        ...(shouldCloseFiscalYear
          ? {
              fiscalYearCloseEntryId: fiscalYearCloseContext?.entryNeeded
                ? fiscalYearCloseEntryId
                : null,
              fiscalYearCloseCreated,
              fiscalYearCloseReused,
            }
          : {}),
      });

      result = {
        ok: true,
        periodKey,
        reused: false,
        ...(shouldCloseFiscalYear
          ? {
              fiscalYearCloseCreated,
              fiscalYearCloseEntryId: fiscalYearCloseContext?.entryNeeded
                ? fiscalYearCloseEntryId
                : null,
              fiscalYearCloseReused,
            }
          : {}),
      };
    });

    return result;
  },
);
