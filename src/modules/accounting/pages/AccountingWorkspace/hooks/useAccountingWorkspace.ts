import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { collection, onSnapshot } from 'firebase/firestore';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { fbCloseAccountingPeriod } from '@/firebase/accounting/fbCloseAccountingPeriod';
import { fbCreateManualJournalEntry } from '@/firebase/accounting/fbCreateManualJournalEntry';
import { fbReplayAccountingEventProjection } from '@/firebase/accounting/fbReplayAccountingEventProjection';
import { fbReverseJournalEntry } from '@/firebase/accounting/fbReverseJournalEntry';
import { db } from '@/firebase/firebaseconfig';
import {
  useAccountingConfig,
  useAccountingPostingProfiles,
  useCashAccounts,
  useChartOfAccounts,
} from '@/modules/accounting/public';
import type { AccountingEvent, JournalEntry } from '@/types/accounting';
import { normalizeAccountingEventRecord } from '@/utils/accounting/accountingEvents';
import { resolveUserDisplayNamesBatch } from '@/utils/users/resolveUserDisplayNamesBatch';
import { normalizeJournalEntryRecord } from '@/utils/accounting/journalEntries';
import {
  isAccountingPeriodClosed,
  resolveAccountingPeriodStatus,
} from '@/utils/accounting/periodClosures';

import {
  buildAvailablePeriods,
  buildLedgerRecords,
  buildPeriodOptions,
  buildWorkspaceSummary,
  normalizeAccountingProjectionDeadLetterRecord,
} from '../utils/accountingWorkspace';

import type {
  AccountingPeriodClosure,
  AccountingProjectionDeadLetter,
} from '../utils/accountingWorkspace';

interface ManualEntryInput {
  description: string;
  entryDate: string;
  lines: Array<{
    accountId: string;
    credit: number;
    debit: number;
    description?: string;
  }>;
  note?: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizePeriodClosure = (
  id: string,
  value: unknown,
): AccountingPeriodClosure => {
  const record = asRecord(value);

  return {
    id,
    periodKey: toCleanString(record.periodKey) ?? id,
    closedAt: record.closedAt ?? null,
    closedBy: toCleanString(record.closedBy),
    note: toCleanString(record.note),
  };
};

interface UseAccountingWorkspaceArgs {
  includeAccountingSetup?: boolean;
  includeLedgerRecords?: boolean;
}

export const useAccountingWorkspace = ({
  includeAccountingSetup = true,
  includeLedgerRecords = true,
}: UseAccountingWorkspaceArgs = {}) => {
  const user = useSelector(selectUser);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const userId = user?.uid ?? user?.id ?? null;
  const {
    bankAccounts,
    config,
    error: configError,
    isAccountingRolloutBusiness,
    loading: configLoading,
  } = useAccountingConfig({
    businessId,
    includeBankingDetails: includeAccountingSetup,
    includeExchangeRateReference: false,
    includeHistory: includeAccountingSetup,
    userId,
  });
  const { cashAccounts } = useCashAccounts({
    businessId,
    userId,
  });
  const {
    chartOfAccounts,
    error: chartError,
    loading: chartLoading,
  } = useChartOfAccounts({
    businessId,
    enabled: includeAccountingSetup && config.generalAccountingEnabled,
    functionalCurrency: config.functionalCurrency,
    userId,
  });
  const {
    error: postingProfilesError,
    loading: postingProfilesLoading,
    postingProfiles,
  } = useAccountingPostingProfiles({
    businessId,
    chartOfAccounts,
    enabled: includeAccountingSetup && config.generalAccountingEnabled,
    userId,
  });
  const eventsQueryKey =
    includeLedgerRecords && businessId && config.generalAccountingEnabled
      ? `accountingEvents:${businessId}`
      : null;
  const deadLettersQueryKey =
    includeLedgerRecords && businessId && config.generalAccountingEnabled
      ? `accountingEventProjectionDeadLetters:${businessId}`
      : null;
  const journalQueryKey =
    includeLedgerRecords && businessId && config.generalAccountingEnabled
      ? `journalEntries:${businessId}`
      : null;
  const periodQueryKey =
    businessId && config.generalAccountingEnabled
      ? `accountingPeriodClosures:${businessId}`
      : null;
  const [accountingEventRecords, setAccountingEvents] = useState<
    AccountingEvent[]
  >([]);
  const [projectionDeadLetterRecords, setProjectionDeadLetters] = useState<
    AccountingProjectionDeadLetter[]
  >([]);
  const [journalEntryRecords, setJournalEntries] = useState<JournalEntry[]>(
    [],
  );
  const [periodClosureRecords, setPeriodClosures] = useState<
    AccountingPeriodClosure[]
  >([]);
  const [eventsSnapshotKey, setEventsSnapshotKey] = useState<string | null>(
    null,
  );
  const [deadLettersSnapshotKey, setDeadLettersSnapshotKey] = useState<
    string | null
  >(null);
  const [journalSnapshotKey, setJournalSnapshotKey] = useState<string | null>(
    null,
  );
  const [periodSnapshotKey, setPeriodSnapshotKey] = useState<string | null>(
    null,
  );
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>(
    {},
  );
  const userNamesByIdRef = useRef<Record<string, string>>({});
  const [savingManualEntry, setSavingManualEntry] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(false);
  const [reversingEntryId, setReversingEntryId] = useState<string | null>(null);
  const [replayingEventId, setReplayingEventId] = useState<string | null>(null);

  const accountingEvents = useMemo(
    () =>
      eventsQueryKey && eventsSnapshotKey === eventsQueryKey
        ? accountingEventRecords
        : [],
    [accountingEventRecords, eventsQueryKey, eventsSnapshotKey],
  );
  const projectionDeadLetters = useMemo(
    () =>
      deadLettersQueryKey && deadLettersSnapshotKey === deadLettersQueryKey
        ? projectionDeadLetterRecords
        : [],
    [
      deadLettersQueryKey,
      deadLettersSnapshotKey,
      projectionDeadLetterRecords,
    ],
  );
  const journalEntries = useMemo(
    () =>
      journalQueryKey && journalSnapshotKey === journalQueryKey
        ? journalEntryRecords
        : [],
    [journalEntryRecords, journalQueryKey, journalSnapshotKey],
  );
  const periodClosures = useMemo(
    () =>
      periodQueryKey && periodSnapshotKey === periodQueryKey
        ? periodClosureRecords
        : [],
    [periodClosureRecords, periodQueryKey, periodSnapshotKey],
  );
  const eventsLoading = Boolean(
    eventsQueryKey && eventsSnapshotKey !== eventsQueryKey,
  );
  const deadLettersLoading = Boolean(
    deadLettersQueryKey && deadLettersSnapshotKey !== deadLettersQueryKey,
  );
  const journalLoading = Boolean(
    journalQueryKey && journalSnapshotKey !== journalQueryKey,
  );
  const periodLoading = Boolean(
    periodQueryKey && periodSnapshotKey !== periodQueryKey,
  );

  useEffect(() => {
    if (!eventsQueryKey || !businessId) return undefined;

    const eventsRef = collection(
      db,
      'businesses',
      businessId,
      'accountingEvents',
    );
    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        setAccountingEvents(
          snapshot.docs.map((docSnapshot) =>
            normalizeAccountingEventRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
            ),
          ),
        );
        setEventsSnapshotKey(eventsQueryKey);
      },
      (cause) => {
        console.error('Error cargando accountingEvents:', cause);
        setAccountingEvents([]);
        setEventsSnapshotKey(eventsQueryKey);
      },
    );

    return () => unsubscribe();
  }, [businessId, eventsQueryKey]);

  useEffect(() => {
    if (!deadLettersQueryKey || !businessId) return undefined;

    const deadLettersRef = collection(
      db,
      'businesses',
      businessId,
      'accountingEventProjectionDeadLetters',
    );
    const unsubscribe = onSnapshot(
      deadLettersRef,
      (snapshot) => {
        setProjectionDeadLetters(
          snapshot.docs.map((docSnapshot) =>
            normalizeAccountingProjectionDeadLetterRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
            ),
          ),
        );
        setDeadLettersSnapshotKey(deadLettersQueryKey);
      },
      (cause) => {
        console.error(
          'Error cargando accountingEventProjectionDeadLetters:',
          cause,
        );
        setProjectionDeadLetters([]);
        setDeadLettersSnapshotKey(deadLettersQueryKey);
      },
    );

    return () => unsubscribe();
  }, [businessId, deadLettersQueryKey]);

  useEffect(() => {
    if (!journalQueryKey || !businessId) return undefined;

    const journalRef = collection(
      db,
      'businesses',
      businessId,
      'journalEntries',
    );
    const unsubscribe = onSnapshot(
      journalRef,
      (snapshot) => {
        setJournalEntries(
          snapshot.docs.map((docSnapshot) =>
            normalizeJournalEntryRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
            ),
          ),
        );
        setJournalSnapshotKey(journalQueryKey);
      },
      (cause) => {
        console.error('Error cargando journalEntries:', cause);
        setJournalEntries([]);
        setJournalSnapshotKey(journalQueryKey);
      },
    );

    return () => unsubscribe();
  }, [businessId, journalQueryKey]);

  useEffect(() => {
    if (!periodQueryKey || !businessId) return undefined;

    const periodsRef = collection(
      db,
      'businesses',
      businessId,
      'accountingPeriodClosures',
    );
    const unsubscribe = onSnapshot(
      periodsRef,
      (snapshot) => {
        setPeriodClosures(
          snapshot.docs.map((docSnapshot) =>
            normalizePeriodClosure(docSnapshot.id, docSnapshot.data()),
          ),
        );
        setPeriodSnapshotKey(periodQueryKey);
      },
      (cause) => {
        console.error('Error cargando accountingPeriodClosures:', cause);
        setPeriodClosures([]);
        setPeriodSnapshotKey(periodQueryKey);
      },
    );

    return () => unsubscribe();
  }, [businessId, periodQueryKey]);

  useEffect(() => {
    if (
      !includeLedgerRecords ||
      !businessId ||
      !config.generalAccountingEnabled
    ) {
      return undefined;
    }

    const candidateIds = Array.from(
      new Set(
        [
          ...accountingEvents.map((event) => event.createdBy),
          ...journalEntries.map((entry) => entry.createdBy),
        ].filter(
          (value): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        ),
      ),
    );

    if (!candidateIds.length) {
      return;
    }

    let cancelled = false;

    void resolveUserDisplayNamesBatch(db, candidateIds, userNamesByIdRef.current)
      .then((loaded) => {
        if (cancelled || !Object.keys(loaded).length) return;
        setUserNamesById((currentValue) => {
          const nextValue = {
            ...currentValue,
            ...loaded,
          };
          userNamesByIdRef.current = nextValue;
          return nextValue;
        });
      })
      .catch((cause) => {
        console.error(
          'Error resolviendo nombres de usuarios contables:',
          cause,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    accountingEvents,
    businessId,
    config.generalAccountingEnabled,
    includeLedgerRecords,
    journalEntries,
  ]);

  const ledgerRecords = useMemo(
    () =>
      buildLedgerRecords({
        accounts: chartOfAccounts,
        bankAccounts,
        cashAccounts,
        events: accountingEvents,
        journalEntries,
        postingProfiles,
        userNamesById,
      }),
    [
      accountingEvents,
      bankAccounts,
      cashAccounts,
      chartOfAccounts,
      journalEntries,
      postingProfiles,
      userNamesById,
    ],
  );

  const periodOptions = useMemo(
    () =>
      buildPeriodOptions(
        buildAvailablePeriods(ledgerRecords),
        ledgerRecords,
        periodClosures,
      ),
    [ledgerRecords, periodClosures],
  );

  const summary = useMemo(
    () => buildWorkspaceSummary(ledgerRecords, periodClosures),
    [ledgerRecords, periodClosures],
  );

  const postingAccounts = useMemo(
    () =>
      chartOfAccounts
        .filter(
          (account) => account.status === 'active' && account.postingAllowed,
        )
        .sort((left, right) => left.code.localeCompare(right.code)),
    [chartOfAccounts],
  );

  const saveManualEntry = useCallback(
    async ({ description, entryDate, lines, note }: ManualEntryInput) => {
      if (!businessId) {
        message.error('No se encontro el negocio activo.');
        return false;
      }

      const periodStatus = resolveAccountingPeriodStatus(
        entryDate,
        periodClosures,
      );
      if (periodStatus.isClosed) {
        message.error(
          'No puedes guardar este asiento con la fecha seleccionada porque ese periodo esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
        );
        return false;
      }

      const sanitizedLines = lines
        .map((line) => ({
          ...line,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        }))
        .filter(
          (line) =>
            line.accountId &&
            ((line.debit > 0 && line.credit === 0) ||
              (line.credit > 0 && line.debit === 0)),
        );

      if (sanitizedLines.length < 2) {
        message.error(
          'El asiento manual requiere al menos dos lineas validas.',
        );
        return false;
      }

      const totals = sanitizedLines.reduce(
        (accumulator, line) => ({
          debit: accumulator.debit + line.debit,
          credit: accumulator.credit + line.credit,
        }),
        { debit: 0, credit: 0 },
      );

      if (Math.abs(totals.debit - totals.credit) > 0.005) {
        message.error(
          'El asiento no cuadra. Debito y credito deben coincidir.',
        );
        return false;
      }

      setSavingManualEntry(true);
      try {
        await fbCreateManualJournalEntry({
          businessId,
          description: description.trim(),
          entryDate,
          lines: sanitizedLines.map((line) => ({
            accountId: line.accountId,
            description: line.description?.trim() || undefined,
            debit: line.debit,
            credit: line.credit,
          })),
          note: note?.trim() || undefined,
        });

        message.success('Asiento manual guardado.');
        return true;
      } catch (cause) {
        console.error('Error guardando asiento manual:', cause);
        message.error('No se pudo guardar el asiento manual.');
        return false;
      } finally {
        setSavingManualEntry(false);
      }
    },
    [businessId, periodClosures],
  );

  const closePeriod = useCallback(
    async (
      periodKey: string,
      note?: string,
      options?: { confirmFiscalYearClose?: boolean },
    ) => {
      if (!businessId) {
        message.error('No se encontro el negocio activo.');
        return false;
      }

      if (isAccountingPeriodClosed(periodKey, periodClosures)) {
        message.info('Ese periodo ya esta cerrado.');
        return true;
      }

      setClosingPeriod(true);
      try {
        const result = await fbCloseAccountingPeriod({
          businessId,
          ...(options?.confirmFiscalYearClose === true
            ? { confirmFiscalYearClose: true }
            : {}),
          periodKey,
          note: note?.trim() || undefined,
        });
        if (result.fiscalYearCloseCreated) {
          message.success('Periodo cerrado y asiento anual generado.');
        } else if (result.fiscalYearCloseReused) {
          message.success('Periodo cerrado con asiento anual existente.');
        } else {
          message.success('Periodo cerrado.');
        }
        return true;
      } catch (cause) {
        console.error('Error cerrando periodo contable:', cause);
        message.error('No se pudo cerrar el periodo.');
        return false;
      } finally {
        setClosingPeriod(false);
      }
    },
    [businessId, periodClosures],
  );

  const reversePostedEntry = useCallback(
    async (entry: JournalEntry) => {
      if (!businessId) {
        message.error('No se encontro el negocio activo.');
        return false;
      }

      if (entry.status === 'reversed') {
        message.info('Ese asiento ya fue revertido.');
        return true;
      }

      setReversingEntryId(entry.id);
      try {
        const result = await fbReverseJournalEntry({
          businessId,
          entryId: entry.id,
        });

        if (result.reused) {
          message.info('Ese asiento ya habia sido revertido.');
        } else {
          message.success('Asiento revertido con un nuevo reverso.');
        }
        return true;
      } catch (cause) {
        console.error('Error reversando asiento contable:', cause);
        message.error('No se pudo reversar el asiento.');
        return false;
      } finally {
        setReversingEntryId(null);
      }
    },
    [businessId],
  );

  const replayProjection = useCallback(
    async (eventId: string) => {
      if (!businessId) {
        message.error('No se encontro el negocio activo.');
        return false;
      }

      setReplayingEventId(eventId);
      try {
        const result = await fbReplayAccountingEventProjection({
          businessId,
          eventId,
        });

        if (result.ok) {
          message.success('Evento contable reprocesado.');
        } else if (result.status === 'pending_account_mapping') {
          message.warning('El evento sigue sin mapeo contable.');
        } else {
          message.error('El evento no pudo reprocesarse.');
        }
        return result.ok;
      } catch (cause) {
        console.error('Error reprocesando evento contable:', cause);
        message.error('No se pudo reprocesar el evento contable.');
        return false;
      } finally {
        setReplayingEventId(null);
      }
    },
    [businessId],
  );

  return {
    accountingEnabled: config.generalAccountingEnabled,
    businessId,
    chartOfAccounts,
    chartError,
    chartLoading,
    configError,
    configLoading,
    functionalCurrency: config.functionalCurrency,
    isAccountingRolloutBusiness,
    journalLoading: journalLoading || eventsLoading || deadLettersLoading,
    ledgerRecords,
    periodClosures,
    periodLoading,
    periodOptions,
    postingAccounts,
    postingProfiles,
    projectionDeadLetters,
    postingProfilesError,
    postingProfilesLoading,
    replayProjection,
    replayingEventId,
    reversePostedEntry,
    saveManualEntry,
    savingManualEntry,
    reversingEntryId,
    summary,
    closePeriod,
    closingPeriod,
  };
};
