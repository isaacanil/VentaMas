import { Alert, Button, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import type { FilterBarItem } from '@/components/common/FilterBar';
import { PageBody } from '@/components/layout/PageShell';
import {
  CalculatorOutlined,
  FileExcelOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from '@/constants/icons/antd';
import { selectUser } from '@/features/auth/userSlice';
import { fbCreateAccountsPayablePaymentRun } from '@/firebase/purchase/fbCreateAccountsPayablePaymentRun';
import {
  fbManageAccountsPayablePaymentRun,
  type ManageAccountsPayablePaymentRunAction,
} from '@/firebase/purchase/fbManageAccountsPayablePaymentRun';
import { MenuApp } from '@/modules/navigation/public';
import { replacePathParams } from '@/router/routes/replacePathParams';
import { ROUTES } from '@/router/routes/routesName';
import { FilterBar } from '@/modules/orderAndPurchase/public';
import {
  RegisterSupplierPaymentModal,
  SupplierPaymentHistoryModal,
} from '@/modules/orderAndPurchase/public';

import { AccountsPayableDetailDrawer } from './components/AccountsPayableDetailDrawer';
import { AccountsPayableControlActionModal } from './components/AccountsPayableControlActionModal';
import { AccountsPayablePaymentProposalModal } from './components/AccountsPayablePaymentProposalModal';
import { AccountsPayablePaymentRunsModal } from './components/AccountsPayablePaymentRunsModal';
import type {
  AccountsPayablePaymentRunActionInput,
  AccountsPayablePaymentRunPaymentInput,
} from './components/AccountsPayablePaymentRunsModal';
import { AccountsPayableSelectionStrip } from './components/AccountsPayableSelectionStrip';
import { AccountsPayableSummaryStrip } from './components/AccountsPayableSummaryStrip';
import { AccountsPayableTable } from './components/AccountsPayableTable';
import { buildAccountsPayableToolbarItems } from './components/AccountsPayableToolbar';
import { useAccountsPayablePaymentRunEvents } from '../../hooks/useAccountsPayablePaymentRunEvents';
import { useAccountsPayablePaymentRuns } from '../../hooks/useAccountsPayablePaymentRuns';
import { useAccountsPayableViewState } from './hooks/useAccountsPayableViewState';
import { exportAccountsPayableWorkbook } from './utils/accountsPayableExport';
import { getAccountsPayablePaymentBlockMessage } from './utils/accountsPayablePaymentEligibility';
import { buildAccountsPayablePaymentProposal } from './utils/accountsPayablePaymentProposal';
import {
  buildAccountsPayableLimitedSelectionNotice,
  appendAccountsPayableQueryScopeNotice,
  buildAccountsPayableQueryScopeNotice,
} from './utils/accountsPayableScope';
import {
  resolveVisibleSelectedAccountsPayableRows,
  selectVisibleAccountsPayableRowIds,
  toggleAccountsPayableRowSelection,
} from './utils/accountsPayableSelection';

import type { AccountsPayableRow } from './utils/accountsPayableDashboard';
import type { Purchase } from '@/utils/purchase/types';
import type { ManageVendorBillControlAction } from '@/firebase/purchase/fbManageVendorBillControl';
import type { UserIdentity } from '@/types/users';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';
import {
  canManageAccountsPayableControlAction,
  getAccountsPayableControlAccessDeniedMessage,
} from '@/utils/access/accountsPayableControlAccess';
import {
  canManageAccountsPayablePaymentRunAction,
  getAccountsPayablePaymentRunAccessDeniedMessage,
} from '@/utils/access/accountsPayablePaymentRunAccess';
import { hasTreasuryOperatorAccess } from '@/utils/access/treasuryOperatorAccess';

interface ControlActionRequest {
  action: ManageVendorBillControlAction;
  row: AccountsPayableRow;
}

interface PaymentRegistrationContext {
  paymentRunId: string | null;
  purchase: Purchase;
  vendorBillId: string | null;
}

const PAYMENT_RUN_ACTION_SUCCESS_LABELS: Record<
  ManageAccountsPayablePaymentRunAction,
  string
> = {
  approve: 'Corrida CxP aprobada correctamente.',
  cancel: 'Corrida CxP cancelada correctamente.',
  reject: 'Corrida CxP rechazada correctamente.',
  submit: 'Corrida CxP enviada a aprobación.',
};

export const AccountsPayable = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser) as UserIdentity | null;
  const activeBusinessId = resolveUserIdentityBusinessId(user);
  const canRegisterPayments = hasTreasuryOperatorAccess(user);
  const canManageControlAction = useCallback(
    (action: ManageVendorBillControlAction) =>
      canManageAccountsPayableControlAction(user, action),
    [user],
  );
  const canManagePaymentRunAction = useCallback(
    (action: ManageAccountsPayablePaymentRunAction) =>
      canManageAccountsPayablePaymentRunAction(user, action),
    [user],
  );
  const getPaymentRunActionDeniedMessage = useCallback(
    (action: ManageAccountsPayablePaymentRunAction) =>
      getAccountsPayablePaymentRunAccessDeniedMessage(user, action),
    [user],
  );
  const controlAccessDeniedMessage =
    getAccountsPayableControlAccessDeniedMessage(user);
  const [selectedRow, setSelectedRow] = useState<AccountsPayableRow | null>(
    null,
  );
  const [paymentRegistrationContext, setPaymentRegistrationContext] =
    useState<PaymentRegistrationContext | null>(null);
  const [paymentHistoryPurchase, setPaymentHistoryPurchase] =
    useState<Purchase | null>(null);
  const [controlActionRequest, setControlActionRequest] =
    useState<ControlActionRequest | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingPaymentRun, setIsCreatingPaymentRun] = useState(false);
  const [paymentProposalOpen, setPaymentProposalOpen] = useState(false);
  const [paymentRunsOpen, setPaymentRunsOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const {
    accountsPayableRows,
    agingBucketFilter,
    canIncreaseQueryLimit,
    dataConfig,
    filterConfig,
    fiscalFilter,
    groupBy,
    handleFilterChange,
    hasActiveAccountsPayableFilters,
    increaseVendorBillQueryLimit,
    isClientFilteredQuery,
    isQueryLimitReached,
    isLoading,
    isSummaryAgingAggregated,
    isSummaryStripLoading,
    loadErrorMessage,
    queryLimit,
    queryLimitMax,
    reviewQueueFilter,
    searchTerm,
    setAgingBucketFilter,
    setFiscalFilter,
    setGroupBy,
    setReviewQueueFilter,
    setSearchTerm,
    setTraceabilityFilter,
    summary,
    aggregateSummaryErrorMessage,
    traceabilityFilter,
    vendorBillRawDocCount,
    openAccountsPayableCount,
    reviewScopedAccountsPayableCount,
  } = useAccountsPayableViewState();
  const {
    error: paymentRunsError,
    hasMore: paymentRunsHasMore,
    loading: paymentRunsLoading,
    rawDocCount: paymentRunsRawDocCount,
    runs: paymentRuns,
  } = useAccountsPayablePaymentRuns(activeBusinessId, paymentRunsOpen);
  const {
    error: paymentRunEventsError,
    eventsByPaymentRunId,
    hasMore: paymentRunEventsHasMore,
    loading: paymentRunEventsLoading,
    rawDocCount: paymentRunEventsRawDocCount,
  } = useAccountsPayablePaymentRunEvents(activeBusinessId, paymentRunsOpen, {
    limit: 100,
  });

  const handleOpenPaymentRuns = useCallback(() => {
    setPaymentRunsOpen(true);
  }, []);

  const renderPaymentRunsButton = useCallback(
    () => (
      <PaymentRunsButton
        aria-label="Abrir historial de corridas de cuentas por pagar"
        icon={<UnorderedListOutlined />}
        onClick={handleOpenPaymentRuns}
      >
        Corridas
      </PaymentRunsButton>
    ),
    [handleOpenPaymentRuns],
  );

  const handleOpenPurchase = (row: AccountsPayableRow) => {
    if (!row.purchase.id) return;

    navigate(
      replacePathParams(
        ROUTES.PURCHASE_TERM.PURCHASES_COMPLETE,
        row.purchase.id,
      ),
    );
  };

  const handleOpenDetail = (row: AccountsPayableRow) => {
    setSelectedRow(row);
  };

  const handleRegisterPayment = (row: AccountsPayableRow) => {
    const paymentBlockMessage = getAccountsPayablePaymentBlockMessage({
      canRegisterPayments,
      row,
    });

    if (paymentBlockMessage) {
      if (!canRegisterPayments) {
        message.error(paymentBlockMessage);
      } else {
        message.warning(paymentBlockMessage);
      }
      return;
    }

    setPaymentRegistrationContext({
      paymentRunId: null,
      purchase: row.purchase,
      vendorBillId: row.id,
    });
  };

  const handleOpenProposalDetail = (row: AccountsPayableRow) => {
    setPaymentProposalOpen(false);
    handleOpenDetail(row);
  };

  const handleRegisterProposalPayment = (row: AccountsPayableRow) => {
    setPaymentProposalOpen(false);
    handleRegisterPayment(row);
  };

  const handleRegisterPaymentRunPayment = useCallback(
    ({ paymentRunId, vendorBillId }: AccountsPayablePaymentRunPaymentInput) => {
      const row = accountsPayableRows.find(
        (entry) =>
          entry.id === vendorBillId || entry.vendorBill.id === vendorBillId,
      );

      if (!row) {
        message.warning(
          'La CxP de esta línea no está en el lote visible. Ajusta los filtros o abre la cuenta desde la tabla para registrar el pago.',
        );
        return;
      }

      const paymentBlockMessage = getAccountsPayablePaymentBlockMessage({
        canRegisterPayments,
        row,
      });

      if (paymentBlockMessage) {
        if (!canRegisterPayments) {
          message.error(paymentBlockMessage);
        } else {
          message.warning(paymentBlockMessage);
        }
        return;
      }

      setPaymentRunsOpen(false);
      setPaymentRegistrationContext({
        paymentRunId,
        purchase: row.purchase,
        vendorBillId,
      });
    },
    [accountsPayableRows, canRegisterPayments],
  );

  const handleOpenPayments = (row: AccountsPayableRow) => {
    setPaymentHistoryPurchase(row.purchase);
  };

  const handleManageControl = (
    row: AccountsPayableRow,
    action: ManageVendorBillControlAction,
  ) => {
    const accessDeniedMessage = getAccountsPayableControlAccessDeniedMessage(
      user,
      action,
    );
    if (accessDeniedMessage) {
      message.warning(accessDeniedMessage);
      return;
    }

    setControlActionRequest({ row, action });
  };

  const handleControlActionCompleted = () => {
    setControlActionRequest(null);
    setSelectedRow(null);
  };

  const handleClearToolbarFilters = () => {
    setAgingBucketFilter('all');
    setFiscalFilter('all');
    setReviewQueueFilter('all');
    setTraceabilityFilter('all');
    setGroupBy('provider');
  };
  const handleClearEmptyStateFilters = () => {
    handleClearToolbarFilters();
    setSearchTerm('');
  };

  const hasActiveToolbarFilters =
    agingBucketFilter !== 'all' ||
    fiscalFilter !== 'all' ||
    reviewQueueFilter !== 'all' ||
    traceabilityFilter !== 'all' ||
    groupBy !== 'provider';
  const emptyReason =
    hasActiveAccountsPayableFilters ||
    openAccountsPayableCount > accountsPayableRows.length ||
    reviewScopedAccountsPayableCount > accountsPayableRows.length
      ? 'filtered'
      : 'no_open';

  const selectedAccountsPayableRows = useMemo(
    () =>
      resolveVisibleSelectedAccountsPayableRows(
        accountsPayableRows,
        selectedRowIds,
      ),
    [accountsPayableRows, selectedRowIds],
  );
  const selectedRowsCount = selectedAccountsPayableRows.length;
  const bulkActionRows =
    selectedRowsCount > 0 ? selectedAccountsPayableRows : accountsPayableRows;
  const hasSelectedRows = selectedRowsCount > 0;
  const selectedRowsLabel = `${selectedRowsCount} seleccionada${
    selectedRowsCount === 1 ? '' : 's'
  }`;
  const visibleRowsLabel = `${accountsPayableRows.length} cuenta${
    accountsPayableRows.length === 1 ? '' : 's'
  } visible${accountsPayableRows.length === 1 ? '' : 's'}`;
  const queryScopeNotice = buildAccountsPayableQueryScopeNotice({
    isClientFilteredQuery,
    isQueryLimitReached,
    queryLimit,
    queryLimitMax,
    rawDocCount: vendorBillRawDocCount,
  });
  const summaryScopeNotice =
    queryScopeNotice && isSummaryAgingAggregated
      ? `${queryScopeNotice} Aging y balance abierto se confirman con agregados del servidor; colas de revision, propuesta y export siguen usando el lote visible.`
      : queryScopeNotice;
  const paymentProposalBlockedReason =
    buildAccountsPayableLimitedSelectionNotice({
      actionLabel: 'generar una propuesta de pago',
      hasSelectedRows,
      isClientFilteredQuery,
      isQueryLimitReached,
      queryLimit,
      queryLimitMax,
      rawDocCount: vendorBillRawDocCount,
    });
  const exportScopeDescription = hasSelectedRows
    ? appendAccountsPayableQueryScopeNotice(
        `${selectedRowsLabel} de ${visibleRowsLabel} con los filtros actuales.`,
        queryScopeNotice,
      )
    : appendAccountsPayableQueryScopeNotice(
        `${visibleRowsLabel} con los filtros actuales.`,
        queryScopeNotice,
      );

  const handleToggleRowSelection = useCallback(
    (row: AccountsPayableRow, checked: boolean) => {
      setSelectedRowIds((previousSelectedRowIds) =>
        toggleAccountsPayableRowSelection(
          previousSelectedRowIds,
          row.id,
          checked,
        ),
      );
    },
    [],
  );

  const handleToggleAllRowsSelection = useCallback(
    (checked: boolean) => {
      setSelectedRowIds(
        checked
          ? selectVisibleAccountsPayableRowIds(accountsPayableRows)
          : new Set(),
      );
    },
    [accountsPayableRows],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
  }, []);

  const handleExportVisibleRows = useCallback(async () => {
    if (!bulkActionRows.length) {
      message.info('No hay cuentas por pagar visibles para exportar.');
      return;
    }

    setIsExporting(true);
    try {
      await exportAccountsPayableWorkbook({
        rows: bulkActionRows,
        scope: {
          description: exportScopeDescription,
          isClientFilteredQuery,
          isQueryLimitReached,
          label: hasSelectedRows ? selectedRowsLabel : 'Lote visible',
          queryLimit,
          queryLimitMax,
          rawDocCount: vendorBillRawDocCount,
        },
      });
      message.success(
        hasSelectedRows
          ? `${selectedRowsLabel} exportadas a Excel.`
          : 'CxP exportado a Excel.',
      );
    } catch (error) {
      console.error('accounts-payable-export-failed', error);
      message.error('No se pudo exportar CxP a Excel.');
    } finally {
      setIsExporting(false);
    }
  }, [
    bulkActionRows,
    exportScopeDescription,
    hasSelectedRows,
    isClientFilteredQuery,
    isQueryLimitReached,
    queryLimit,
    queryLimitMax,
    selectedRowsLabel,
    vendorBillRawDocCount,
  ]);

  const extraFilterItems = buildAccountsPayableToolbarItems({
    agingBucketFilter,
    fiscalFilter,
    groupBy,
    onAgingBucketChange: setAgingBucketFilter,
    onFiscalFilterChange: setFiscalFilter,
    onGroupByChange: setGroupBy,
    onTraceabilityChange: setTraceabilityFilter,
    traceabilityFilter,
  });

  const paymentProposal = useMemo(
    () => buildAccountsPayablePaymentProposal(bulkActionRows),
    [bulkActionRows],
  );
  const paymentProposalScopeLabel = hasSelectedRows
    ? selectedRowsLabel
    : 'Lote visible';
  const paymentProposalScopeDescription = hasSelectedRows
    ? appendAccountsPayableQueryScopeNotice(
        `${selectedRowsLabel} de ${visibleRowsLabel} con los filtros actuales.`,
        queryScopeNotice,
      )
    : appendAccountsPayableQueryScopeNotice(
        `${visibleRowsLabel} con los filtros actuales.`,
        queryScopeNotice,
      );
  const paymentRunBlockedReason =
    buildAccountsPayableLimitedSelectionNotice({
      actionLabel: 'guardar una corrida CxP',
      hasSelectedRows,
      isClientFilteredQuery,
      isQueryLimitReached,
      queryLimit,
      queryLimitMax,
      rawDocCount: vendorBillRawDocCount,
    });

  const handleOpenPaymentProposal = useCallback(() => {
    if (paymentProposalBlockedReason) {
      message.warning(paymentProposalBlockedReason);
      return;
    }

    setPaymentProposalOpen(true);
  }, [paymentProposalBlockedReason]);

  const handleCreatePaymentRun = useCallback(async () => {
    if (paymentRunBlockedReason) {
      message.warning(paymentRunBlockedReason);
      return;
    }

    const vendorBillIds = paymentProposal.recommendedRows
      .map((row) => row.id)
      .filter(Boolean);

    if (!vendorBillIds.length) {
      message.warning('No hay cuentas con vencimiento para guardar corrida.');
      return;
    }

    setIsCreatingPaymentRun(true);
    try {
      const result = await fbCreateAccountsPayablePaymentRun(user, {
        vendorBillIds,
        scope: {
          description: paymentProposalScopeDescription,
          isClientFilteredQuery,
          isQueryLimitReached,
          label: paymentProposalScopeLabel,
          queryLimit,
          rawDocCount: vendorBillRawDocCount,
        },
      });
      message.success(
        `Corrida CxP ${result.paymentRunId} guardada para revisión.`,
      );
    } catch (error) {
      console.error('accounts-payable-payment-run-create-failed', error);
      message.error('No se pudo guardar la corrida CxP.');
    } finally {
      setIsCreatingPaymentRun(false);
    }
  }, [
    isClientFilteredQuery,
    isQueryLimitReached,
    paymentProposal.recommendedRows,
    paymentProposalScopeDescription,
    paymentProposalScopeLabel,
    paymentRunBlockedReason,
    queryLimit,
    user,
    vendorBillRawDocCount,
  ]);

  const handleManagePaymentRun = useCallback(
    async ({
      action,
      evidenceNote,
      paymentRunId,
      reason,
    }: AccountsPayablePaymentRunActionInput) => {
      const accessDeniedMessage = getAccountsPayablePaymentRunAccessDeniedMessage(
        user,
        action,
      );
      if (accessDeniedMessage) {
        message.warning(accessDeniedMessage);
        throw new Error(accessDeniedMessage);
      }

      try {
        await fbManageAccountsPayablePaymentRun(user, {
          action,
          businessId: activeBusinessId,
          evidenceNote,
          paymentRunId,
          reason,
        });
        message.success(PAYMENT_RUN_ACTION_SUCCESS_LABELS[action]);
      } catch (error) {
        console.error('accounts-payable-payment-run-manage-failed', error);
        message.error(
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar la corrida CxP.',
        );
        throw error;
      }
    },
    [activeBusinessId, user],
  );

  const trailingFilterItems = useMemo<FilterBarItem[]>(
    () => [
      {
        key: 'accounts-payable-payment-runs',
        type: 'custom',
        section: 'main',
        collapsible: false,
        visibleOnMobile: false,
        wrap: false,
        minWidth: 116,
        render: renderPaymentRunsButton,
      },
      ...(hasSelectedRows
        ? []
        : [
            {
              key: 'accounts-payable-payment-proposal',
              type: 'custom' as const,
              section: 'main' as const,
              collapsible: false,
              wrap: false,
              minWidth: 128,
              render: () => (
                <Button
                  aria-label="Abrir propuesta de pago de cuentas por pagar visibles"
                  disabled={isLoading || bulkActionRows.length === 0}
                  icon={<CalculatorOutlined />}
                  onClick={handleOpenPaymentProposal}
                >
                  Propuesta
                </Button>
              ),
            },
            {
              key: 'export-accounts-payable',
              type: 'custom' as const,
              section: 'main' as const,
              collapsible: false,
              wrap: false,
              minWidth: 148,
              render: () => (
                <Button
                  aria-label="Exportar cuentas por pagar visibles a Excel"
                  disabled={
                    isLoading || isExporting || bulkActionRows.length === 0
                  }
                  icon={<FileExcelOutlined />}
                  loading={isExporting}
                  onClick={() => {
                    void handleExportVisibleRows();
                  }}
                >
                  {isExporting ? 'Exportando' : 'Exportar Excel'}
                </Button>
              ),
            },
          ]),
    ],
    [
      bulkActionRows.length,
      handleExportVisibleRows,
      handleOpenPaymentProposal,
      hasSelectedRows,
      isExporting,
      isLoading,
      renderPaymentRunsButton,
    ],
  );

  return (
    <>
      <MenuApp sectionName="Cuentas por Pagar" />
      <Container>
        <PageTitle>Cuentas por Pagar</PageTitle>
        <AccountsPayableSummaryStrip
          activeBucket={agingBucketFilter}
          activeReviewQueue={reviewQueueFilter}
          hasError={Boolean(loadErrorMessage)}
          loading={isSummaryStripLoading}
          onSelectBucket={setAgingBucketFilter}
          onSelectReviewQueue={setReviewQueueFilter}
          scopeNotice={summaryScopeNotice}
          summary={summary}
        />

        <FilterBarSection>
          <FilterBar
            compactSortButton
            config={filterConfig}
            dataConfig={dataConfig}
            extraItems={extraFilterItems}
            hasActiveExtraFilters={hasActiveToolbarFilters}
            onChange={handleFilterChange}
            onClearExtraFilters={handleClearToolbarFilters}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            sortLabel="Vencimiento"
            mobileHeaderRight={renderPaymentRunsButton()}
            trailingItems={trailingFilterItems}
          />
        </FilterBarSection>

        {loadErrorMessage ? (
          <DataStateNotice>
            <Alert
              message="No se pudo cargar CxP"
              description={loadErrorMessage}
              showIcon
              type="error"
            />
          </DataStateNotice>
        ) : null}

        {isClientFilteredQuery ? (
          <DataStateNotice>
            <Alert
              message="Consulta CxP en modo compatibilidad"
              description={
                <LimitNoticeContent>
                  <span>
                    Falta un índice optimizado de Firestore para esta
                    combinación de filtros. Se leyeron {vendorBillRawDocCount}{' '}
                    registros y algunos filtros se aplican en el navegador; los
                    totales, la propuesta de pago y el export dependen del lote
                    visible hasta completar el índice o cargar más registros.
                  </span>
                </LimitNoticeContent>
              }
              showIcon
              type="warning"
            />
          </DataStateNotice>
        ) : null}

        {isQueryLimitReached ? (
          <DataStateNotice>
            <Alert
              message={`Mostrando las primeras ${queryLimit} cuentas por pagar`}
              description={
                <LimitNoticeContent>
                  <span>
                    {isSummaryAgingAggregated
                      ? 'El balance abierto y el aging salen de agregados del servidor; las colas de revisión, la propuesta de pago y el export se calculan sobre el lote visible.'
                      : 'Los totales, la propuesta de pago y el export se calculan sobre el lote visible.'}
                    {canIncreaseQueryLimit
                      ? ' Carga otro lote o usa filtros para reducir el alcance.'
                      : ` Alcanzaste el máximo operativo de ${queryLimitMax} registros; usa filtros para reducir el alcance.`}
                  </span>
                  {canIncreaseQueryLimit ? (
                    <Button
                      disabled={isLoading}
                      onClick={increaseVendorBillQueryLimit}
                      size="small"
                    >
                      Cargar 500 más
                    </Button>
                  ) : null}
                </LimitNoticeContent>
              }
              showIcon
              type="warning"
            />
          </DataStateNotice>
        ) : null}

        {aggregateSummaryErrorMessage && !loadErrorMessage ? (
          <DataStateNotice>
            <Alert
              message="Agregados CxP no disponibles"
              description={`${aggregateSummaryErrorMessage} Mientras tanto, el resumen usa el lote visible.`}
              showIcon
              type="warning"
            />
          </DataStateNotice>
        ) : null}

        {hasSelectedRows ? (
          <AccountsPayableSelectionStrip
            hasError={Boolean(loadErrorMessage)}
            isExporting={isExporting}
            isLoading={isLoading}
            onClearSelection={handleClearSelection}
            onExportSelection={handleExportVisibleRows}
            onOpenPaymentProposal={handleOpenPaymentProposal}
            paymentProposal={paymentProposal}
            paymentProposalBlockedReason={paymentProposalBlockedReason}
            selectedRowsCount={selectedRowsCount}
            visibleRowsCount={accountsPayableRows.length}
          />
        ) : null}

        <TableSection>
          <AccountsPayableTable
            canRegisterPayments={canRegisterPayments}
            canManageControlAction={canManageControlAction}
            controlAccessDeniedMessage={controlAccessDeniedMessage ?? undefined}
            emptyReason={emptyReason}
            groupBy={groupBy}
            hasError={Boolean(loadErrorMessage)}
            loading={isLoading}
            onToggleAllRowsSelection={handleToggleAllRowsSelection}
            onToggleRowSelection={handleToggleRowSelection}
            onOpenDetail={handleOpenDetail}
            onOpenPayments={handleOpenPayments}
            onOpenPurchase={handleOpenPurchase}
            onClearFilters={handleClearEmptyStateFilters}
            onManageControl={handleManageControl}
            onRegisterPayment={handleRegisterPayment}
            rows={accountsPayableRows}
            selectedRowIds={selectedRowIds}
          />
        </TableSection>
      </Container>

      <AccountsPayableDetailDrawer
        canRegisterPayments={canRegisterPayments}
        canManageControlAction={canManageControlAction}
        controlAccessDeniedMessage={controlAccessDeniedMessage ?? undefined}
        onClose={() => setSelectedRow(null)}
        onOpenPayments={() =>
          selectedRow ? handleOpenPayments(selectedRow) : undefined
        }
        onOpenPurchase={() =>
          selectedRow ? handleOpenPurchase(selectedRow) : undefined
        }
        onManageControl={handleManageControl}
        onRegisterPayment={() =>
          selectedRow ? handleRegisterPayment(selectedRow) : undefined
        }
        open={Boolean(selectedRow)}
        row={selectedRow}
      />

      <AccountsPayableControlActionModal
        action={controlActionRequest?.action ?? null}
        onCancel={() => setControlActionRequest(null)}
        onCompleted={handleControlActionCompleted}
        open={Boolean(controlActionRequest)}
        row={controlActionRequest?.row ?? null}
      />

      <AccountsPayablePaymentProposalModal
        canRegisterPayments={canRegisterPayments}
        createRunIcon={<SaveOutlined />}
        creatingRun={isCreatingPaymentRun}
        onClose={() => setPaymentProposalOpen(false)}
        onCreateRun={handleCreatePaymentRun}
        onOpenDetail={handleOpenProposalDetail}
        onRegisterPayment={handleRegisterProposalPayment}
        open={paymentProposalOpen}
        paymentRunBlockedReason={paymentRunBlockedReason}
        proposal={paymentProposal}
        scopeDescription={paymentProposalScopeDescription}
        scopeLabel={paymentProposalScopeLabel}
      />

      <AccountsPayablePaymentRunsModal
        error={paymentRunsError}
        eventsByPaymentRunId={eventsByPaymentRunId}
        eventsError={paymentRunEventsError}
        eventsHasMore={paymentRunEventsHasMore}
        eventsLoading={paymentRunEventsLoading}
        eventsRawDocCount={paymentRunEventsRawDocCount}
        canManageRunAction={canManagePaymentRunAction}
        canRegisterPayments={canRegisterPayments}
        getManageRunActionDeniedMessage={getPaymentRunActionDeniedMessage}
        hasMore={paymentRunsHasMore}
        loading={paymentRunsLoading}
        onClose={() => setPaymentRunsOpen(false)}
        onManageRun={handleManagePaymentRun}
        onRegisterPayment={handleRegisterPaymentRunPayment}
        open={paymentRunsOpen}
        rawDocCount={paymentRunsRawDocCount}
        runs={paymentRuns}
      />

      <RegisterSupplierPaymentModal
        key={[
          paymentRegistrationContext?.purchase.id ??
            'accounts-payable-register',
          paymentRegistrationContext?.vendorBillId ?? 'vendor-bill',
          paymentRegistrationContext?.paymentRunId ?? 'no-run',
        ].join(':')}
        onCancel={() => setPaymentRegistrationContext(null)}
        onPaymentRegistered={() => setSelectedRow(null)}
        open={Boolean(paymentRegistrationContext)}
        paymentRunId={paymentRegistrationContext?.paymentRunId ?? null}
        purchase={paymentRegistrationContext?.purchase ?? null}
        vendorBillId={paymentRegistrationContext?.vendorBillId ?? null}
      />

      <SupplierPaymentHistoryModal
        key={paymentHistoryPurchase?.id ?? 'accounts-payable-history'}
        onCancel={() => setPaymentHistoryPurchase(null)}
        open={Boolean(paymentHistoryPurchase)}
        purchase={paymentHistoryPurchase}
      />
    </>
  );
};

const Container = styled(PageBody)`
  display: grid;
  gap: 12px;
  grid-template-rows: repeat(4, min-content);
  min-width: 0;
  min-height: 0;
  overflow: hidden auto;
`;

const PageTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  border: 0;
  white-space: nowrap;
`;

const FilterBarSection = styled.div`
  min-width: 0;

  > div {
    min-width: 0;
    border-bottom: none;
  }
`;

const DataStateNotice = styled.div`
  min-width: 0;
`;

const PaymentRunsButton = styled(Button)`
  min-height: 36px;

  @media (pointer: coarse) {
    min-height: 44px;
  }
`;

const LimitNoticeContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const TableSection = styled.div`
  height: clamp(420px, 55vh, 560px);
  min-width: 0;
  overflow: hidden;

  @media (width <= 768px) {
    height: clamp(360px, 52vh, 460px);
  }
`;
