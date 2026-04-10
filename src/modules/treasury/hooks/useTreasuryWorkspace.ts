import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { useAccountingConfig } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig';
import { useCashAccounts } from '@/modules/treasury/hooks/useCashAccounts';
import type {
  BankReconciliationRecord,
  InternalTransfer,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import {
  buildTreasuryLiquidityAccounts,
  calculateLiquidityCurrentBalance,
  getLatestReconciliationByBankAccount,
  groupLedgerEntriesByAccount,
  sortByOccurredAtDesc,
} from '../utils/liquidity';
import {
  normalizeBankReconciliationRecord,
  normalizeInternalTransferRecord,
  normalizeLiquidityLedgerEntryRecord,
  toNormalizedOccurredAt,
  type BankReconciliationDraft,
  type InternalTransferDraft,
} from '../utils/records';

interface UseTreasuryWorkspaceArgs {
  businessId: string | null;
  userId: string | null;
}

export const useTreasuryWorkspace = ({
  businessId,
  userId,
}: UseTreasuryWorkspaceArgs) => {
  const accountingConfig = useAccountingConfig({
    businessId,
    userId,
  });
  const {
    addBankAccount,
    bankAccounts,
    bankAccountsLoading,
    config,
    error: accountingError,
    loading: accountingLoading,
    updateBankAccount,
    updateBankAccountStatus,
    updateBankPaymentPolicy,
  } = accountingConfig;
  const {
    addCashAccount,
    cashAccounts,
    error: cashAccountsError,
    loading: cashAccountsLoading,
    updateCashAccount,
    updateCashAccountStatus,
  } = useCashAccounts({
    businessId,
    userId,
  });
  const [ledgerState, setLedgerState] = useState<{
    entries: LiquidityLedgerEntry[];
    error: string | null;
    key: string | null;
  }>({
    entries: [],
    error: null,
    key: null,
  });
  const [internalTransfersState, setInternalTransfersState] = useState<{
    error: string | null;
    key: string | null;
    transfers: InternalTransfer[];
  }>({
    error: null,
    key: null,
    transfers: [],
  });
  const [reconciliationsState, setReconciliationsState] = useState<{
    error: string | null;
    key: string | null;
    reconciliations: BankReconciliationRecord[];
  }>({
    error: null,
    key: null,
    reconciliations: [],
  });
  const ledgerQueryKey = businessId ? `treasury-ledger:${businessId}` : null;
  const internalTransfersQueryKey = businessId
    ? `treasury-transfers:${businessId}`
    : null;
  const reconciliationsQueryKey = businessId
    ? `treasury-reconciliations:${businessId}`
    : null;

  useEffect(() => {
    if (!ledgerQueryKey || !businessId) return undefined;
    const ledgerQuery = query(
      collection(db, 'businesses', businessId, 'liquidityLedger'),
      orderBy('occurredAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      ledgerQuery,
      (snapshot) => {
        setLedgerState({
          entries: snapshot.docs.map((ledgerDoc) =>
            normalizeLiquidityLedgerEntryRecord(
              ledgerDoc.id,
              businessId,
              ledgerDoc.data(),
            ),
          ),
          error: null,
          key: ledgerQueryKey,
        });
      },
      (cause) => {
        console.error('Error cargando ledger de liquidez:', cause);
        setLedgerState({
          entries: [],
          error: cause.message || 'No se pudo cargar el ledger de tesorería.',
          key: ledgerQueryKey,
        });
      },
    );

    return unsubscribe;
  }, [businessId, ledgerQueryKey]);

  useEffect(() => {
    if (!internalTransfersQueryKey || !businessId) return undefined;
    const transfersQuery = query(
      collection(db, 'businesses', businessId, 'internalTransfers'),
      orderBy('occurredAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      transfersQuery,
      (snapshot) => {
        setInternalTransfersState({
          transfers: snapshot.docs.map((transferDoc) =>
            normalizeInternalTransferRecord(
              transferDoc.id,
              businessId,
              transferDoc.data(),
            ),
          ),
          error: null,
          key: internalTransfersQueryKey,
        });
      },
      (cause) => {
        console.error('Error cargando transferencias internas:', cause);
        setInternalTransfersState({
          error:
            cause.message || 'No se pudieron cargar las transferencias internas.',
          key: internalTransfersQueryKey,
          transfers: [],
        });
      },
    );

    return unsubscribe;
  }, [businessId, internalTransfersQueryKey]);

  useEffect(() => {
    if (!reconciliationsQueryKey || !businessId) return undefined;
    const reconciliationsQuery = query(
      collection(db, 'businesses', businessId, 'bankReconciliations'),
      orderBy('statementDate', 'desc'),
    );

    const unsubscribe = onSnapshot(
      reconciliationsQuery,
      (snapshot) => {
        setReconciliationsState({
          reconciliations: snapshot.docs.map((reconciliationDoc) =>
            normalizeBankReconciliationRecord(
              reconciliationDoc.id,
              businessId,
              reconciliationDoc.data(),
            ),
          ),
          error: null,
          key: reconciliationsQueryKey,
        });
      },
      (cause) => {
        console.error('Error cargando conciliaciones bancarias:', cause);
        setReconciliationsState({
          error:
            cause.message || 'No se pudieron cargar las conciliaciones bancarias.',
          key: reconciliationsQueryKey,
          reconciliations: [],
        });
      },
    );

    return unsubscribe;
  }, [businessId, reconciliationsQueryKey]);

  const resolvedCashAccounts = useMemo(() => cashAccounts, [cashAccounts]);
  const resolvedLedgerEntries = useMemo(
    () =>
      ledgerQueryKey && ledgerState.key === ledgerQueryKey
        ? ledgerState.entries
        : [],
    [ledgerQueryKey, ledgerState.entries, ledgerState.key],
  );
  const resolvedInternalTransfers = useMemo(
    () =>
      internalTransfersQueryKey &&
      internalTransfersState.key === internalTransfersQueryKey
        ? internalTransfersState.transfers
        : [],
    [
      internalTransfersQueryKey,
      internalTransfersState.key,
      internalTransfersState.transfers,
    ],
  );
  const resolvedReconciliations = useMemo(
    () =>
      reconciliationsQueryKey &&
      reconciliationsState.key === reconciliationsQueryKey
        ? reconciliationsState.reconciliations
        : [],
    [
      reconciliationsQueryKey,
      reconciliationsState.key,
      reconciliationsState.reconciliations,
    ],
  );
  const ledgerLoading = Boolean(ledgerQueryKey && ledgerState.key !== ledgerQueryKey);
  const internalTransfersLoading = Boolean(
    internalTransfersQueryKey && internalTransfersState.key !== internalTransfersQueryKey,
  );
  const reconciliationsLoading = Boolean(
    reconciliationsQueryKey && reconciliationsState.key !== reconciliationsQueryKey,
  );

  const liquidityAccounts = useMemo(
    () =>
      buildTreasuryLiquidityAccounts({
        bankAccounts,
        cashAccounts: resolvedCashAccounts,
      }),
    [bankAccounts, resolvedCashAccounts],
  );

  const ledgerEntriesByAccountKey = useMemo(
    () => groupLedgerEntriesByAccount(resolvedLedgerEntries),
    [resolvedLedgerEntries],
  );

  const currentBalancesByAccountKey = useMemo(
    () =>
      Object.fromEntries(
        liquidityAccounts.map((account) => [
          account.key,
          calculateLiquidityCurrentBalance({
            account,
            entries: ledgerEntriesByAccountKey[account.key] ?? [],
          }),
        ]),
      ),
    [ledgerEntriesByAccountKey, liquidityAccounts],
  );

  const latestReconciliationsByBankAccountId = useMemo(
    () => getLatestReconciliationByBankAccount(resolvedReconciliations),
    [resolvedReconciliations],
  );

  const recordInternalTransfer = useCallback(
    async (draft: InternalTransferDraft) => {
      if (!businessId) return;

      if (
        draft.fromAccountId === draft.toAccountId &&
        draft.fromAccountType === draft.toAccountType
      ) {
        void message.error('Origen y destino deben ser distintos.');
        return;
      }

      const amount = Number(draft.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        void message.error('El monto de la transferencia debe ser mayor a cero.');
        return;
      }

      const sourceAccount =
        liquidityAccounts.find(
          (account) =>
            account.id === draft.fromAccountId &&
            account.kind === draft.fromAccountType,
        ) ?? null;
      const destinationAccount =
        liquidityAccounts.find(
          (account) =>
            account.id === draft.toAccountId &&
            account.kind === draft.toAccountType,
        ) ?? null;

      if (!sourceAccount || !destinationAccount) {
        void message.error('Selecciona cuentas válidas para transferir.');
        return;
      }

      if (
        sourceAccount.status !== 'active' ||
        destinationAccount.status !== 'active'
      ) {
        void message.error('Solo se puede transferir entre cuentas activas.');
        return;
      }

      if (sourceAccount.currency !== destinationAccount.currency) {
        void message.error(
          'La transferencia interna requiere cuentas de la misma moneda.',
        );
        return;
      }

      const occurredAt = toNormalizedOccurredAt(draft.occurredAt) ?? Timestamp.now();
      const transferRef = doc(
        collection(db, 'businesses', businessId, 'internalTransfers'),
      );
      const outboundLedgerRef = doc(
        collection(db, 'businesses', businessId, 'liquidityLedger'),
      );
      const inboundLedgerRef = doc(
        collection(db, 'businesses', businessId, 'liquidityLedger'),
      );
      const now = Timestamp.now();
      const batch = writeBatch(db);

      batch.set(transferRef, {
        id: transferRef.id,
        businessId,
        fromAccountId: draft.fromAccountId,
        fromAccountType: draft.fromAccountType,
        toAccountId: draft.toAccountId,
        toAccountType: draft.toAccountType,
        currency: draft.currency,
        amount,
        occurredAt,
        status: 'posted',
        reference: draft.reference?.trim() || null,
        notes: draft.notes?.trim() || null,
        createdAt: now,
        createdBy: userId ?? null,
        ledgerEntryIds: [outboundLedgerRef.id, inboundLedgerRef.id],
      });

      batch.set(outboundLedgerRef, {
        id: outboundLedgerRef.id,
        businessId,
        accountId: draft.fromAccountId,
        accountType: draft.fromAccountType,
        currency: draft.currency,
        direction: 'out',
        amount,
        occurredAt,
        createdAt: now,
        createdBy: userId ?? null,
        status: 'posted',
        sourceType: 'internal_transfer',
        sourceId: transferRef.id,
        reference: draft.reference?.trim() || null,
        description: draft.notes?.trim() || 'Transferencia interna',
        counterpartyAccountId: draft.toAccountId,
        counterpartyAccountType: draft.toAccountType,
      });

      batch.set(inboundLedgerRef, {
        id: inboundLedgerRef.id,
        businessId,
        accountId: draft.toAccountId,
        accountType: draft.toAccountType,
        currency: draft.currency,
        direction: 'in',
        amount,
        occurredAt,
        createdAt: now,
        createdBy: userId ?? null,
        status: 'posted',
        sourceType: 'internal_transfer',
        sourceId: transferRef.id,
        reference: draft.reference?.trim() || null,
        description: draft.notes?.trim() || 'Transferencia interna',
        counterpartyAccountId: draft.fromAccountId,
        counterpartyAccountType: draft.fromAccountType,
      });

      await batch.commit();
      void message.success('Transferencia interna registrada.');
    },
    [businessId, liquidityAccounts, userId],
  );

  const recordBankReconciliation = useCallback(
    async (draft: BankReconciliationDraft) => {
      if (!businessId) return;

      const bankAccount = bankAccounts.find(
        (account) => account.id === draft.bankAccountId,
      );
      if (!bankAccount) {
        void message.error('Selecciona una cuenta bancaria válida.');
        return;
      }

      const statementBalance = Number(draft.statementBalance ?? 0);
      if (!Number.isFinite(statementBalance)) {
        void message.error('El balance del estado de cuenta no es válido.');
        return;
      }

      const reconciliationRef = doc(
        collection(db, 'businesses', businessId, 'bankReconciliations'),
      );
      const statementDate =
        toNormalizedOccurredAt(draft.statementDate) ?? Timestamp.now();
      const ledgerBalance =
        currentBalancesByAccountKey[`bank:${draft.bankAccountId}`] ??
        Number(bankAccount.openingBalance ?? 0);
      const variance = Number((statementBalance - ledgerBalance).toFixed(2));

      await writeBatch(db)
        .set(reconciliationRef, {
          id: reconciliationRef.id,
          businessId,
          bankAccountId: draft.bankAccountId,
          statementDate,
          statementBalance,
          ledgerBalance,
          variance,
          status: variance === 0 ? 'balanced' : 'variance',
          reference: draft.reference?.trim() || null,
          notes: draft.notes?.trim() || null,
          createdAt: Timestamp.now(),
          createdBy: userId ?? null,
        })
        .commit();

      void message.success('Conciliación bancaria registrada.');
    },
    [bankAccounts, businessId, currentBalancesByAccountKey, userId],
  );

  const overallLoading =
    accountingLoading ||
    bankAccountsLoading ||
    cashAccountsLoading ||
    ledgerLoading ||
    internalTransfersLoading ||
    reconciliationsLoading;
  const error = businessId
    ? ledgerState.error ??
      internalTransfersState.error ??
      reconciliationsState.error ??
      cashAccountsError ??
      accountingError ??
      null
    : accountingError ?? null;

  const recentLedgerEntries = useMemo(
    () => sortByOccurredAtDesc(resolvedLedgerEntries).slice(0, 20),
    [resolvedLedgerEntries],
  );

  const recentTransfers = useMemo(
    () => sortByOccurredAtDesc(resolvedInternalTransfers).slice(0, 10),
    [resolvedInternalTransfers],
  );

  return {
    addBankAccount,
    addCashAccount,
    bankAccounts,
    bankAccountsLoading,
    cashAccounts: resolvedCashAccounts,
    cashAccountsLoading,
    config,
    currentBalancesByAccountKey,
    error,
    internalTransfers: resolvedInternalTransfers,
    internalTransfersLoading,
    latestReconciliationsByBankAccountId,
    ledgerEntries: resolvedLedgerEntries,
    ledgerEntriesByAccountKey,
    ledgerLoading,
    liquidityAccounts,
    overallLoading,
    recentLedgerEntries,
    recentTransfers,
    recordBankReconciliation,
    recordInternalTransfer,
    reconciliations: resolvedReconciliations,
    reconciliationsLoading,
    updateBankAccount,
    updateBankAccountStatus,
    updateBankPaymentPolicy,
    updateCashAccount,
    updateCashAccountStatus,
  };
};

export type UseTreasuryWorkspaceResult = ReturnType<typeof useTreasuryWorkspace>;
