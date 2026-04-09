import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { GetAccountingReportsInputSchema } from '../../../../shared/accountingSchemas.js';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildFinancialReports,
  buildGeneralLedgerAccountOptions,
  buildGeneralLedgerSnapshot,
  buildPostedLedgerRecords,
  normalizeAccountingEventRecord,
  normalizeChartOfAccountRecord,
  normalizeJournalEntryRecord,
  serializeGeneralLedgerSnapshot,
} from '../utils/accountingReports.util.js';
import {
  resolveJournalPeriodKey,
} from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import { parseSchemaOrThrow } from '../utils/zodHttps.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const DEFAULT_LEDGER_PAGE_SIZE = 50;
const MAX_DISCOVERED_PERIODS = 24;
const MAX_PERIOD_DISCOVERY_DOCS = 1200;

const chunkValues = (values, size = 200) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const loadAccountingEventsById = async ({ businessId, eventIds }) => {
  const uniqueIds = Array.from(new Set((eventIds || []).filter(Boolean)));
  if (!uniqueIds.length) {
    return new Map();
  }

  const eventRefs = uniqueIds.map((eventId) =>
    db.doc(`businesses/${businessId}/accountingEvents/${eventId}`),
  );
  const chunks = chunkValues(eventRefs, 100);
  const snapshots = [];

  for (const refsChunk of chunks) {
    const chunkSnapshots = await db.getAll(...refsChunk);
    snapshots.push(...chunkSnapshots);
  }

  return new Map(
    snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => [
        snapshot.id,
        normalizeAccountingEventRecord(snapshot.id, businessId, snapshot.data()),
      ]),
  );
};

const appendRequestedPeriod = (periods, requestedPeriodKey) => {
  if (!requestedPeriodKey || periods.includes(requestedPeriodKey)) {
    return periods;
  }

  return [...periods, requestedPeriodKey].sort((left, right) =>
    right.localeCompare(left),
  );
};

const discoverRecentPeriods = async (businessId) => {
  const snapshot = await db
    .collection(`businesses/${businessId}/journalEntries`)
    .orderBy('periodKey', 'desc')
    .limit(MAX_PERIOD_DISCOVERY_DOCS)
    .get();

  const periods = [];
  const seen = new Set();

  snapshot.docs.forEach((docSnapshot) => {
    const periodKey = toCleanString(docSnapshot.data()?.periodKey);
    if (!periodKey || seen.has(periodKey)) {
      return;
    }

    seen.add(periodKey);
    periods.push(periodKey);
  });

  const currentPeriodKey = resolveJournalPeriodKey(new Date());
  if (!seen.has(currentPeriodKey)) {
    periods.push(currentPeriodKey);
  }

  return periods
    .sort((left, right) => right.localeCompare(left))
    .slice(0, MAX_DISCOVERED_PERIODS);
};

const loadJournalEntries = async ({ businessId, periodKey, operator = '==', includeEvents = false }) => {
  if (!periodKey) {
    return {
      journalEntries: [],
      eventsById: new Map(),
      records: [],
    };
  }

  const snapshot = await db
    .collection(`businesses/${businessId}/journalEntries`)
    .where('periodKey', operator, periodKey)
    .get();

  const journalEntries = snapshot.docs.map((docSnapshot) =>
    normalizeJournalEntryRecord(
      docSnapshot.id,
      businessId,
      docSnapshot.data(),
    ),
  );
  const eventIds = includeEvents ? journalEntries.map((entry) => entry.eventId) : [];
  const eventsById = includeEvents
    ? await loadAccountingEventsById({
        businessId,
        eventIds,
      })
    : new Map();

  return {
    journalEntries,
    eventsById,
    records: buildPostedLedgerRecords({
      journalEntries,
      eventsById,
    }),
  };
};

export const getAccountingReports = onCall(
  { cors: true, invoker: 'public', region: 'us-central1' },
  async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const {
    businessId,
    includeFinancialReports,
    includeGeneralLedger,
    ledgerAccountId,
    ledgerPage,
    ledgerPageSize,
    ledgerPeriodKey,
    ledgerQuery,
    reportPeriodKey,
  } = parseSchemaOrThrow(
    GetAccountingReportsInputSchema,
    {
      businessId:
        toCleanString(payload.businessId) ||
        toCleanString(payload.businessID) ||
        null,
      includeFinancialReports: payload.includeFinancialReports,
      includeGeneralLedger: payload.includeGeneralLedger,
      ledgerAccountId: toCleanString(payload.ledgerAccountId),
      ledgerPage: payload.ledgerPage ?? 1,
      ledgerPageSize: payload.ledgerPageSize ?? DEFAULT_LEDGER_PAGE_SIZE,
      ledgerPeriodKey: toCleanString(payload.ledgerPeriodKey),
      ledgerQuery: toCleanString(payload.ledgerQuery),
      reportPeriodKey: toCleanString(payload.reportPeriodKey),
    },
    'No se pudieron validar los parámetros del reporte contable.',
  );

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  const accountingSettings =
    await getPilotAccountingSettingsForBusiness(businessId);
  const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
    accountingSettings,
  );
  if (!rolloutEnabled || accountingSettings?.generalAccountingEnabled !== true) {
    throw new HttpsError(
      'failed-precondition',
      'La contabilidad general no está habilitada para este negocio.',
    );
  }

  const [chartSnapshot, journalSnapshot] = await Promise.all([
    db.collection(`businesses/${businessId}/chartOfAccounts`).orderBy('code').get(),
    discoverRecentPeriods(businessId),
  ]);

  const chartOfAccounts = chartSnapshot.docs.map((docSnapshot) =>
    normalizeChartOfAccountRecord(
      docSnapshot.id,
      businessId,
      docSnapshot.data(),
    ),
  );
  const periods = appendRequestedPeriod(
    appendRequestedPeriod(journalSnapshot, ledgerPeriodKey),
    reportPeriodKey,
  );
  const fallbackPeriodKey = periods[0] || resolveJournalPeriodKey(new Date());
  const selectedLedgerPeriodKey = includeGeneralLedger
    ? ledgerPeriodKey && periods.includes(ledgerPeriodKey)
      ? ledgerPeriodKey
      : fallbackPeriodKey
    : null;
  const selectedReportPeriodKey = includeFinancialReports
    ? reportPeriodKey && periods.includes(reportPeriodKey)
      ? reportPeriodKey
      : fallbackPeriodKey
    : null;

  const [ledgerPeriodData, ledgerOpeningData, reportData] = await Promise.all([
    includeGeneralLedger && selectedLedgerPeriodKey
      ? loadJournalEntries({
          businessId,
          periodKey: selectedLedgerPeriodKey,
          operator: '==',
          includeEvents: true,
        })
      : Promise.resolve({ journalEntries: [], eventsById: new Map(), records: [] }),
    includeGeneralLedger && selectedLedgerPeriodKey
      ? loadJournalEntries({
          businessId,
          periodKey: selectedLedgerPeriodKey,
          operator: '<',
          includeEvents: false,
        })
      : Promise.resolve({ journalEntries: [], eventsById: new Map(), records: [] }),
    includeFinancialReports && selectedReportPeriodKey
      ? loadJournalEntries({
          businessId,
          periodKey: selectedReportPeriodKey,
          operator: '<=',
          includeEvents: false,
        })
      : Promise.resolve({ journalEntries: [], eventsById: new Map(), records: [] }),
  ]);

  const ledgerRecords = [
    ...ledgerOpeningData.records,
    ...ledgerPeriodData.records,
  ];
  const accountOptions = includeGeneralLedger
    ? buildGeneralLedgerAccountOptions({
        accounts: chartOfAccounts,
        records: ledgerPeriodData.records,
      })
    : [];
  const selectedLedgerAccountId =
    includeGeneralLedger
      ? accountOptions.find((option) => option.id === ledgerAccountId)?.id ||
        accountOptions.find((option) => option.movementCount > 0)?.id ||
        accountOptions[0]?.id ||
        null
      : null;
  const selectedLedgerAccount = selectedLedgerAccountId
    ? chartOfAccounts.find((account) => account.id === selectedLedgerAccountId) ||
      null
    : null;

  const generalLedgerSnapshot = selectedLedgerAccount
    ? buildGeneralLedgerSnapshot({
        account: selectedLedgerAccount,
        periodKey: selectedLedgerPeriodKey,
        records: ledgerRecords,
        page: ledgerPage,
        pageSize: ledgerPageSize,
        searchQuery: ledgerQuery,
      })
    : null;
  const financialReports =
    includeFinancialReports &&
    selectedReportPeriodKey &&
    buildFinancialReports({
      accounts: chartOfAccounts,
      periodKey: selectedReportPeriodKey,
      records: reportData.records,
    });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    periods,
    generalLedger: {
      selectedAccountId: selectedLedgerAccountId,
      selectedPeriodKey: selectedLedgerPeriodKey,
      accountOptions,
      snapshot: serializeGeneralLedgerSnapshot(generalLedgerSnapshot),
    },
    financialReports: {
      selectedPeriodKey: selectedReportPeriodKey,
      snapshot: financialReports ?? null,
    },
  };
  },
);
