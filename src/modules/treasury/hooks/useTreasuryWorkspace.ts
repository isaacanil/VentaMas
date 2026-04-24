import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  Timestamp,
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { fbCreateBankReconciliation } from '@/firebase/treasury/fbCreateBankReconciliation';
import { fbCreateBankStatementLine } from '@/firebase/treasury/fbCreateBankStatementLine';
import { fbCreateInternalTransfer } from '@/firebase/treasury/fbCreateInternalTransfer';
import { fbResolveBankStatementLineMatch } from '@/firebase/treasury/fbResolveBankStatementLineMatch';
import { useAccountingConfig } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig';
import { useCashAccounts } from '@/modules/treasury/hooks/useCashAccounts';
import type {
  BankReconciliationRecord,
  BankStatementLine,
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
import { buildTreasuryIdempotencyKey } from '../utils/idempotency';
import {
  normalizeBankReconciliationRecord,
  normalizeBankStatementLineRecord,
  normalizeCashMovementAsLiquidityLedgerEntry,
  normalizeInternalTransferRecord,
  toNormalizedOccurredAt,
  type BankReconciliationDraft,
  type BankStatementLineDraft,
  type InternalTransferDraft,
  type ResolveBankStatementLineDraft,
} from '../utils/records';

interface UseTreasuryWorkspaceArgs {
  businessId: string | null;
  userId: string | null;
}

const resolveTreasuryOperationErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const typedError = error as {
    code?: string;
    message?: string;
  };
  const code = String(typedError.code || '').toLowerCase();
  const messageText = String(typedError.message || '').trim();

  if (code.includes('permission-denied')) {
    return 'No tienes permisos para ejecutar esta acción.';
  }
  if (code.includes('unauthenticated')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }
  if (messageText) {
    return messageText;
  }

  return fallbackMessage;
};

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
    bankInstitutionCatalog,
    bankInstitutionCatalogError,
    bankInstitutionCatalogLoading,
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
  const [statementLinesState, setStatementLinesState] = useState<{
    error: string | null;
    key: string | null;
    statementLines: BankStatementLine[];
  }>({
    error: null,
    key: null,
    statementLines: [],
  });
  const ledgerQueryKey = businessId ? `treasury-ledger:${businessId}` : null;
  const internalTransfersQueryKey = businessId
    ? `treasury-transfers:${businessId}`
    : null;
  const reconciliationsQueryKey = businessId
    ? `treasury-reconciliations:${businessId}`
    : null;
  const statementLinesQueryKey = businessId
    ? `treasury-bank-statement-lines:${businessId}`
    : null;

  useEffect(() => {
    if (!ledgerQueryKey || !businessId) return undefined;

    const unsubscribe = onSnapshot(
      collection(db, 'businesses', businessId, 'cashMovements'),
      (snapshot) => {
        setLedgerState({
          entries: sortByOccurredAtDesc(
            snapshot.docs
              .map((movementDoc) =>
                normalizeCashMovementAsLiquidityLedgerEntry(
                  movementDoc.id,
                  businessId,
                  movementDoc.data(),
                ),
              )
              .filter(
                (entry): entry is LiquidityLedgerEntry => entry != null,
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

    const unsubscribe = onSnapshot(
      collection(db, 'businesses', businessId, 'internalTransfers'),
      (snapshot) => {
        setInternalTransfersState({
          transfers: sortByOccurredAtDesc(
            snapshot.docs.map((transferDoc) =>
              normalizeInternalTransferRecord(
                transferDoc.id,
                businessId,
                transferDoc.data(),
              ),
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

    const unsubscribe = onSnapshot(
      collection(db, 'businesses', businessId, 'bankReconciliations'),
      (snapshot) => {
        setReconciliationsState({
          reconciliations: sortByOccurredAtDesc(
            snapshot.docs.map((reconciliationDoc) => {
              const record = normalizeBankReconciliationRecord(
                reconciliationDoc.id,
                businessId,
                reconciliationDoc.data(),
              );

              return {
                ...record,
                occurredAt: record.statementDate,
              };
            }),
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

  useEffect(() => {
    if (!statementLinesQueryKey || !businessId) return undefined;

    const unsubscribe = onSnapshot(
      collection(db, 'businesses', businessId, 'bankStatementLines'),
      (snapshot) => {
        setStatementLinesState({
          error: null,
          key: statementLinesQueryKey,
          statementLines: sortByOccurredAtDesc(
            snapshot.docs.map((statementLineDoc) => {
              const normalizedStatementLine = normalizeBankStatementLineRecord(
                statementLineDoc.id,
                businessId,
                statementLineDoc.data(),
              );

              return {
                ...normalizedStatementLine,
                occurredAt: normalizedStatementLine.statementDate,
              };
            }),
          ),
        });
      },
      (cause) => {
        console.error('Error cargando líneas de extracto bancario:', cause);
        setStatementLinesState({
          error:
            cause.message || 'No se pudieron cargar las líneas de extracto bancario.',
          key: statementLinesQueryKey,
          statementLines: [],
        });
      },
    );

    return unsubscribe;
  }, [businessId, statementLinesQueryKey]);

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
  const statementLinesLoading = Boolean(
    statementLinesQueryKey && statementLinesState.key !== statementLinesQueryKey,
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
  const resolvedStatementLines = useMemo(
    () =>
      statementLinesQueryKey && statementLinesState.key === statementLinesQueryKey
        ? statementLinesState.statementLines
        : [],
    [statementLinesQueryKey, statementLinesState.key, statementLinesState.statementLines],
  );
  const statementLinesByBankAccountId = useMemo(
    () =>
      resolvedStatementLines.reduce<Record<string, BankStatementLine[]>>(
        (accumulator, statementLine) => {
          if (!accumulator[statementLine.bankAccountId]) {
            accumulator[statementLine.bankAccountId] = [];
          }
          accumulator[statementLine.bankAccountId].push(statementLine);
          return accumulator;
        },
        {},
      ),
    [resolvedStatementLines],
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
      const sourceCurrentBalance =
        currentBalancesByAccountKey[sourceAccount.key] ??
        Number(sourceAccount.openingBalance ?? 0);
      const sourceProjectedBalance = Number(
        (sourceCurrentBalance - amount).toFixed(2),
      );

      if (sourceProjectedBalance < 0 && draft.allowOverdraft !== true) {
        void message.error(
          'La transferencia deja saldo negativo en la cuenta origen. Autoriza sobregiro o reduce el monto.',
        );
        return;
      }

      const occurredAt = toNormalizedOccurredAt(draft.occurredAt) ?? Timestamp.now();
      try {
        await fbCreateInternalTransfer({
          allowOverdraft: draft.allowOverdraft === true,
          businessId,
          amount,
          currency: draft.currency,
          occurredAt: occurredAt.toMillis(),
          reference: draft.reference?.trim() || null,
          note: draft.notes?.trim() || null,
          idempotencyKey: buildTreasuryIdempotencyKey('internal-transfer', [
            businessId,
            draft.fromAccountType,
            draft.fromAccountId,
            draft.toAccountType,
            draft.toAccountId,
            amount,
            occurredAt.toMillis(),
            draft.reference?.trim() || '',
          ]),
          from:
            draft.fromAccountType === 'cash'
              ? {
                  type: 'cash',
                  cashAccountId: draft.fromAccountId,
                }
              : {
                  type: 'bank',
                  bankAccountId: draft.fromAccountId,
                },
          to:
            draft.toAccountType === 'cash'
              ? {
                  type: 'cash',
                  cashAccountId: draft.toAccountId,
                }
              : {
                  type: 'bank',
                  bankAccountId: draft.toAccountId,
                },
        });
      } catch (error) {
        void message.error(
          resolveTreasuryOperationErrorMessage(
            error,
            'No se pudo registrar la transferencia interna.',
          ),
        );
        throw error;
      }

      void message.success('Transferencia interna registrada.');
    },
    [businessId, currentBalancesByAccountKey, liquidityAccounts],
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

      const statementDate =
        toNormalizedOccurredAt(draft.statementDate) ?? Timestamp.now();
      const ledgerBalance =
        currentBalancesByAccountKey[`bank:${draft.bankAccountId}`] ??
        Number(bankAccount.openingBalance ?? 0);
      const variance = Number((statementBalance - ledgerBalance).toFixed(2));

      try {
        await fbCreateBankReconciliation({
          businessId,
          bankAccountId: draft.bankAccountId,
          statementBalance,
          statementDate: statementDate.toMillis(),
          reference: draft.reference?.trim() || null,
          note: draft.notes?.trim() || null,
          idempotencyKey: buildTreasuryIdempotencyKey('bank-reconciliation', [
            businessId,
            draft.bankAccountId,
            statementBalance,
            statementDate.toMillis(),
            draft.reference?.trim() || '',
          ]),
        });
      } catch (error) {
        void message.error(
          resolveTreasuryOperationErrorMessage(
            error,
            'No se pudo registrar la conciliación bancaria.',
          ),
        );
        throw error;
      }

      void message.success('Conciliación bancaria registrada.');
    },
    [bankAccounts, businessId, currentBalancesByAccountKey],
  );

  const recordBankStatementLine = useCallback(
    async (draft: BankStatementLineDraft) => {
      if (!businessId) return;

      const bankAccount = bankAccounts.find(
        (account) => account.id === draft.bankAccountId,
      );
      if (!bankAccount) {
        void message.error('Selecciona una cuenta bancaria válida.');
        return;
      }

      const amount = Number(draft.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        void message.error('El monto de la línea bancaria debe ser mayor a cero.');
        return;
      }

      const statementDate =
        toNormalizedOccurredAt(draft.statementDate) ?? Timestamp.now();
      const movementIds = Array.isArray(draft.movementIds)
        ? draft.movementIds.filter(Boolean)
        : [];

      const submitStatementLine = async () =>
        fbCreateBankStatementLine({
          amount,
          bankAccountId: draft.bankAccountId,
          businessId,
          description: draft.description?.trim() || null,
          direction: draft.direction,
          idempotencyKey: buildTreasuryIdempotencyKey('bank-statement-line', [
            businessId,
            draft.bankAccountId,
            draft.direction,
            amount,
            statementDate.toMillis(),
            draft.reference?.trim() || '',
            movementIds.join(','),
          ]),
          movementIds,
          reference: draft.reference?.trim() || null,
          statementDate: statementDate.toMillis(),
        });

      try {
        const response = await submitStatementLine();

        void message.success(
          response.matchStatus === 'reconciled'
            ? 'Línea bancaria conciliada.'
            : 'Línea bancaria registrada como excepción pendiente.',
        );
      } catch (error) {
        void message.error(
          resolveTreasuryOperationErrorMessage(
            error,
            'No se pudo registrar la línea de extracto bancario.',
          ),
        );
        throw error;
      }
    },
    [bankAccounts, businessId],
  );

  const importBankStatementLines = useCallback(
    async (drafts: BankStatementLineDraft[]) => {
      if (!businessId) {
        return {
          failures: [],
          imported: 0,
          pending: 0,
          reconciled: 0,
        };
      }

      let imported = 0;
      let pending = 0;
      let reconciled = 0;
      const failures: Array<{ lineNumber: number; message: string }> = [];

      for (let index = 0; index < drafts.length; index += 1) {
        const draft = drafts[index];
        const bankAccount = bankAccounts.find(
          (account) => account.id === draft.bankAccountId,
        );
        if (!bankAccount) {
          failures.push({
            lineNumber: index + 1,
            message: 'Cuenta bancaria inválida.',
          });
          continue;
        }

        const amount = Number(draft.amount ?? 0);
        const statementDate =
          toNormalizedOccurredAt(draft.statementDate) ?? Timestamp.now();
        const movementIds = Array.isArray(draft.movementIds)
          ? draft.movementIds.filter(Boolean)
          : [];

        try {
          const response = await fbCreateBankStatementLine({
            amount,
            bankAccountId: draft.bankAccountId,
            businessId,
            description: draft.description?.trim() || null,
            direction: draft.direction,
            idempotencyKey: buildTreasuryIdempotencyKey('bank-statement-line-import', [
              businessId,
              draft.bankAccountId,
              draft.direction,
              amount,
              statementDate.toMillis(),
              draft.reference?.trim() || '',
              movementIds.join(','),
              index + 1,
            ]),
            movementIds,
            reference: draft.reference?.trim() || null,
            statementDate: statementDate.toMillis(),
          });

          imported += 1;
          if (response.matchStatus === 'reconciled') {
            reconciled += 1;
          } else {
            pending += 1;
          }
        } catch (error) {
          failures.push({
            lineNumber: index + 1,
            message: resolveTreasuryOperationErrorMessage(
              error,
              'No se pudo importar la línea.',
            ),
          });
        }
      }

      if (imported > 0 && failures.length === 0) {
        void message.success(
          `${imported} línea(s) importadas. ${reconciled} conciliadas y ${pending} pendientes.`,
        );
      } else if (imported > 0) {
        void message.warning(
          `${imported} línea(s) importadas. ${failures.length} fallaron.`,
        );
      } else if (failures.length > 0) {
        void message.error('Ninguna línea pudo importarse.');
      }

      return {
        failures,
        imported,
        pending,
        reconciled,
      };
    },
    [bankAccounts, businessId],
  );

  const resolveBankStatementLine = useCallback(
    async (draft: ResolveBankStatementLineDraft) => {
      if (!businessId) return;

      if (!draft.statementLineId) {
        void message.error('Selecciona la excepción pendiente.');
        return;
      }

      const resolutionMode = draft.resolutionMode === 'write_off' ? 'write_off' : 'match';
      const movementIds = Array.isArray(draft.movementIds)
        ? draft.movementIds.filter(Boolean)
        : [];
      if (resolutionMode === 'match' && !movementIds.length) {
        void message.error('Selecciona al menos un movimiento para resolver.');
        return;
      }
      if (resolutionMode === 'write_off' && !draft.writeOffReason?.trim()) {
        void message.error('Indica el motivo del ajuste.');
        return;
      }

      try {
        const response = await fbResolveBankStatementLineMatch({
          businessId,
          idempotencyKey: buildTreasuryIdempotencyKey('resolve-bank-statement-line', [
            businessId,
            draft.statementLineId,
            resolutionMode,
            movementIds.join(','),
            draft.writeOffReason?.trim() || '',
            draft.writeOffNotes?.trim() || '',
          ]),
          movementIds,
          resolutionMode,
          statementLineId: draft.statementLineId,
          writeOffNotes: draft.writeOffNotes?.trim() || null,
          writeOffReason: draft.writeOffReason?.trim() || null,
        });

        void message.success(
          response.resolutionMode === 'write_off'
            ? 'Diferencia bancaria ajustada.'
            : 'Excepción bancaria resuelta.',
        );
      } catch (error) {
        void message.error(
          resolveTreasuryOperationErrorMessage(
            error,
            'No se pudo resolver la excepción bancaria.',
          ),
        );
        throw error;
      }
    },
    [businessId],
  );

  const overallLoading =
    accountingLoading ||
    bankAccountsLoading ||
    cashAccountsLoading ||
    ledgerLoading ||
    internalTransfersLoading ||
    reconciliationsLoading ||
    statementLinesLoading;
  const error = businessId
    ? ledgerState.error ??
      internalTransfersState.error ??
      reconciliationsState.error ??
      statementLinesState.error ??
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
    bankInstitutionCatalog,
    bankInstitutionCatalogError,
    bankInstitutionCatalogLoading,
    bankAccountsLoading,
    cashAccounts: resolvedCashAccounts,
    cashAccountsLoading,
    config,
    currentBalancesByAccountKey,
    error,
    internalTransfers: resolvedInternalTransfers,
    internalTransfersLoading,
    latestReconciliationsByBankAccountId,
    importBankStatementLines,
    ledgerEntries: resolvedLedgerEntries,
    ledgerEntriesByAccountKey,
    ledgerLoading,
    liquidityAccounts,
    overallLoading,
    recentLedgerEntries,
    recentTransfers,
    recordBankReconciliation,
    recordBankStatementLine,
    recordInternalTransfer,
    resolveBankStatementLine,
    reconciliations: resolvedReconciliations,
    reconciliationsLoading,
    statementLines: resolvedStatementLines,
    statementLinesByBankAccountId,
    statementLinesLoading,
    updateBankAccount,
    updateBankAccountStatus,
    updateBankPaymentPolicy,
    updateCashAccount,
    updateCashAccountStatus,
  };
};

export type UseTreasuryWorkspaceResult = ReturnType<typeof useTreasuryWorkspace>;
