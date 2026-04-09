import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { fbCloseAccountingPeriod } from '@/firebase/accounting/fbCloseAccountingPeriod';
import { fbCreateManualJournalEntry } from '@/firebase/accounting/fbCreateManualJournalEntry';
import { fbReverseJournalEntry } from '@/firebase/accounting/fbReverseJournalEntry';
import { db } from '@/firebase/firebaseconfig';
import { useAccountingConfig } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig';
import { useAccountingPostingProfiles } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles';
import { useChartOfAccounts } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts';
import type { AccountingEvent, JournalEntry } from '@/types/accounting';
import { normalizeAccountingEventRecord } from '@/utils/accounting/accountingEvents';
import {
  normalizeJournalEntryRecord,
} from '@/utils/accounting/journalEntries';
import {
  isAccountingPeriodClosed,
  resolveAccountingPeriodStatus,
} from '@/utils/accounting/periodClosures';

import {
  buildAvailablePeriods,
  buildLedgerRecords,
  buildPeriodOptions,
  buildWorkspaceSummary,
} from '../utils/accountingWorkspace';

import type { AccountingPeriodClosure } from '../utils/accountingWorkspace';

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
  includeLedgerRecords?: boolean;
}

export const useAccountingWorkspace = ({
  includeLedgerRecords = true,
}: UseAccountingWorkspaceArgs = {}) => {
  const user = useSelector(selectUser);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const userId = user?.uid ?? user?.id ?? null;
  const {
    config,
    error: configError,
    isAccountingRolloutBusiness,
    loading: configLoading,
  } = useAccountingConfig({
    businessId,
    userId,
  });
  const {
    chartOfAccounts,
    error: chartError,
    loading: chartLoading,
  } = useChartOfAccounts({
    businessId,
    enabled: config.generalAccountingEnabled,
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
    enabled: config.generalAccountingEnabled,
    userId,
  });
  const [accountingEvents, setAccountingEvents] = useState<AccountingEvent[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [periodClosures, setPeriodClosures] = useState<AccountingPeriodClosure[]>(
    [],
  );
  const [eventsLoading, setEventsLoading] = useState(true);
  const [journalLoading, setJournalLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [savingManualEntry, setSavingManualEntry] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(false);
  const [reversingEntryId, setReversingEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!includeLedgerRecords || !businessId || !config.generalAccountingEnabled) {
      setAccountingEvents([]);
      setEventsLoading(false);
      return;
    }

    setEventsLoading(true);

    const eventsRef = collection(db, 'businesses', businessId, 'accountingEvents');
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
        setEventsLoading(false);
      },
      (cause) => {
        console.error('Error cargando accountingEvents:', cause);
        setAccountingEvents([]);
        setEventsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessId, config.generalAccountingEnabled, includeLedgerRecords]);

  useEffect(() => {
    if (!includeLedgerRecords || !businessId || !config.generalAccountingEnabled) {
      setJournalEntries([]);
      setJournalLoading(false);
      return;
    }

    setJournalLoading(true);

    const journalRef = collection(db, 'businesses', businessId, 'journalEntries');
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
        setJournalLoading(false);
      },
      (cause) => {
        console.error('Error cargando journalEntries:', cause);
        setJournalEntries([]);
        setJournalLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessId, config.generalAccountingEnabled, includeLedgerRecords]);

  useEffect(() => {
    if (!businessId || !config.generalAccountingEnabled) {
      setPeriodClosures([]);
      setPeriodLoading(false);
      return;
    }

    setPeriodLoading(true);

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
        setPeriodLoading(false);
      },
      (cause) => {
        console.error('Error cargando accountingPeriodClosures:', cause);
        setPeriodClosures([]);
        setPeriodLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessId, config.generalAccountingEnabled]);

  const ledgerRecords = useMemo(
    () =>
      buildLedgerRecords({
        accounts: chartOfAccounts,
        events: accountingEvents,
        journalEntries,
        postingProfiles,
      }),
    [accountingEvents, chartOfAccounts, journalEntries, postingProfiles],
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
        message.error('El asiento manual requiere al menos dos lineas validas.');
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
        message.error('El asiento no cuadra. Debito y credito deben coincidir.');
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
    [
      businessId,
      periodClosures,
    ],
  );

  const closePeriod = useCallback(
    async (periodKey: string, note?: string) => {
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
        await fbCloseAccountingPeriod({
          businessId,
          periodKey,
          note: note?.trim() || undefined,
        });
        message.success('Periodo cerrado.');
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
    journalLoading: journalLoading || eventsLoading,
    ledgerRecords,
    periodClosures,
    periodLoading,
    periodOptions,
    postingAccounts,
    postingProfiles,
    postingProfilesError,
    postingProfilesLoading,
    reversePostedEntry,
    saveManualEntry,
    savingManualEntry,
    reversingEntryId,
    summary,
    closePeriod,
    closingPeriod,
  };
};
