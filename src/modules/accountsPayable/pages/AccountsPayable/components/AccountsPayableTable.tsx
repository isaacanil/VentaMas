import { MoreOutlined } from '@ant-design/icons';
import { Button, Checkbox, Dropdown, type MenuProps } from 'antd';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import styled from 'styled-components';
import { EyeOutlined, ShoppingCartOutlined } from '@/constants/icons/antd';
import { DollarCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import {
  AdvancedTable,
  type ColumnConfig,
} from '@/components/ui/AdvancedTable';
import { formatPrice } from '@/utils/format/formatPrice';
import type { ManageVendorBillControlAction } from '@/firebase/purchase/fbManageVendorBillControl';

import type {
  AccountsPayableGroupBy,
  AccountsPayableRow,
} from '../utils/accountsPayableDashboard';
import { hasAccountsPayablePaymentBalance } from '../utils/accountsPayablePaymentEligibility';
import { buildAccountsPayableControlMenuItems } from '../utils/accountsPayableControlMenuItems';
import { getAccountsPayableControlActions } from '../utils/accountsPayableControlActions';

interface AccountsPayableTableProps {
  canManageControlAction: (action: ManageVendorBillControlAction) => boolean;
  canRegisterPayments: boolean;
  controlAccessDeniedMessage?: string;
  emptyReason?: 'filtered' | 'no_open';
  groupBy: AccountsPayableGroupBy;
  hasError?: boolean;
  loading: boolean;
  onClearFilters?: () => void;
  onToggleAllRowsSelection: (checked: boolean) => void;
  onToggleRowSelection: (row: AccountsPayableRow, checked: boolean) => void;
  onOpenDetail: (row: AccountsPayableRow) => void;
  onOpenPayments: (row: AccountsPayableRow) => void;
  onOpenPurchase: (row: AccountsPayableRow) => void;
  onManageControl: (
    row: AccountsPayableRow,
    action: ManageVendorBillControlAction,
  ) => void;
  onRegisterPayment: (row: AccountsPayableRow) => void;
  rows: AccountsPayableRow[];
  selectedRowIds: ReadonlySet<string>;
}

type AccountsPayableTableRow = AccountsPayableRow &
  Record<string, unknown> & {
    actions: AccountsPayableRow;
  };

const formatDate = (value: number | null) =>
  value ? DateTime.fromMillis(value).toFormat('dd/MM/yyyy') : 'Sin fecha';

const AgingBadge = ({ row }: { row: AccountsPayableRow }) => (
  <AgingPill $tone={row.agingTone}>{row.agingLabel}</AgingPill>
);

const TraceabilityCell = ({ row }: { row: AccountsPayableRow }) => (
  <TraceabilityBlock>
    <strong>{row.traceabilitySummary}</strong>
    <span>Compra {row.reference}</span>
  </TraceabilityBlock>
);

const FiscalCell = ({ row }: { row: AccountsPayableRow }) => (
  <FiscalBlock>
    <strong title={row.fiscalSnapshot.fiscalLabel}>
      {row.fiscalSnapshot.fiscalLabel}
    </strong>
    <span title={row.fiscalSnapshot.vendorReferenceLabel}>
      {row.fiscalSnapshot.vendorReferenceLabel}
    </span>
    {row.fiscalSnapshot.documentType ? (
      <span title={row.fiscalSnapshot.documentType}>
        {row.fiscalSnapshot.documentType}
      </span>
    ) : null}
  </FiscalBlock>
);

const AccountingCell = ({ row }: { row: AccountsPayableRow }) => (
  <AccountingBlock>
    <ControlPill $tone={row.accountingSnapshot.statusTone}>
      {row.accountingSnapshot.statusLabel}
    </ControlPill>
    <span>
      Fecha contable {formatDate(row.accountingSnapshot.accountingDate)}
    </span>
    <span>
      {row.accountingSnapshot.documentNatureLabel} ·{' '}
      {row.accountingSnapshot.settlementTimingLabel}
    </span>
  </AccountingBlock>
);

const PaymentControlCell = ({ row }: { row: AccountsPayableRow }) => (
  <PaymentControlBlock>
    <ControlPill $tone={row.paymentControl.tone}>
      {row.paymentControl.label}
    </ControlPill>
    {row.paymentControl.reason ? (
      <ControlReason>{row.paymentControl.reason}</ControlReason>
    ) : null}
  </PaymentControlBlock>
);

const RowActions = ({
  row,
  onOpenDetail,
  onOpenPayments,
  onOpenPurchase,
  onManageControl,
  onRegisterPayment,
  canRegisterPayments,
  canManageControlAction,
  controlAccessDeniedMessage,
}: {
  canManageControlAction: (action: ManageVendorBillControlAction) => boolean;
  canRegisterPayments: boolean;
  controlAccessDeniedMessage?: string;
  row: AccountsPayableRow;
  onOpenDetail: (row: AccountsPayableRow) => void;
  onOpenPayments: (row: AccountsPayableRow) => void;
  onOpenPurchase: (row: AccountsPayableRow) => void;
  onManageControl: (
    row: AccountsPayableRow,
    action: ManageVendorBillControlAction,
  ) => void;
  onRegisterPayment: (row: AccountsPayableRow) => void;
}) => {
  const controlActions = getAccountsPayableControlActions(row);
  const visibleControlActions = controlActions.filter((definition) =>
    canManageControlAction(definition.action),
  );
  const controlItems = buildAccountsPayableControlMenuItems({
    actions: visibleControlActions,
    onSelect: (action) => onManageControl(row, action),
  });
  const controlMenuItems: MenuProps['items'] =
    controlActions.length === 0
      ? [
          {
            key: 'no-control-actions',
            disabled: true,
            label: 'Sin acciones de control',
          },
        ]
      : visibleControlActions.length === 0
        ? [
            {
              key: 'no-control-access',
              disabled: true,
              label:
                controlAccessDeniedMessage ??
                'Tu rol no puede gestionar controles de CxP.',
            },
          ]
        : controlItems;
  const hasPaymentBalance = hasAccountsPayablePaymentBalance(row);
  const isPaymentRegistrationEnabled =
    canRegisterPayments &&
    row.paymentControl.canRegisterPayment &&
    hasPaymentBalance;
  const registerPaymentLabel = !canRegisterPayments
    ? 'Registrar pago sin permiso'
    : row.paymentControl.canRegisterPayment
      ? hasPaymentBalance
        ? 'Registrar pago'
        : 'Sin balance pendiente'
      : 'Registrar pago bloqueado';
  const items: MenuProps['items'] = [
    {
      key: 'view-detail',
      icon: <EyeOutlined />,
      label: 'Ver detalle',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onOpenDetail(row);
      },
    },
    {
      key: 'open-purchase',
      icon: <ShoppingCartOutlined />,
      label: 'Abrir compra',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onOpenPurchase(row);
      },
    },
    {
      key: 'view-payments',
      icon: <HistoryOutlined />,
      label: 'Ver pagos',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onOpenPayments(row);
      },
    },
    {
      key: 'register-payment',
      icon: <DollarCircleOutlined />,
      disabled: !isPaymentRegistrationEnabled,
      label: registerPaymentLabel,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        if (!isPaymentRegistrationEnabled) return;
        onRegisterPayment(row);
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'control-cxp',
      label: 'Control CxP',
      children: controlMenuItems,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <ActionButton
        icon={<MoreOutlined />}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        aria-label="Acciones de la cuenta por pagar"
      />
    </Dropdown>
  );
};

const columns: ColumnConfig<AccountsPayableTableRow>[] = [
  {
    Header: 'Compra',
    accessor: 'reference',
    minWidth: '120px',
    maxWidth: '120px',
  },
  {
    Header: 'Proveedor',
    accessor: 'providerName',
    minWidth: '220px',
  },
  {
    Header: 'Fiscal',
    accessor: 'fiscalSnapshot',
    minWidth: '190px',
    cell: ({ row }) => <FiscalCell row={row} />,
  },
  {
    Header: 'Contable',
    accessor: 'accountingSnapshot',
    minWidth: '190px',
    cell: ({ row }) => <AccountingCell row={row} />,
  },
  {
    Header: 'Condición',
    accessor: 'conditionLabel',
    minWidth: '120px',
  },
  {
    Header: 'Vence',
    accessor: 'dueAt',
    minWidth: '120px',
    cell: ({ value }) => (
      <span>{formatDate((value as number | null) ?? null)}</span>
    ),
  },
  {
    Header: 'Aging',
    accessor: 'agingLabel',
    minWidth: '180px',
    cell: ({ row }) => <AgingBadge row={row} />,
  },
  {
    Header: 'Control',
    accessor: 'paymentControl',
    minWidth: '170px',
    cell: ({ row }) => <PaymentControlCell row={row} />,
  },
  {
    Header: 'Pagado',
    accessor: 'paidAmount',
    minWidth: '130px',
    align: 'right',
    cell: ({ value }) => <span>{formatPrice(Number(value ?? 0))}</span>,
  },
  {
    Header: 'Balance',
    accessor: 'balanceAmount',
    minWidth: '140px',
    align: 'right',
    cell: ({ value }) => <strong>{formatPrice(Number(value ?? 0))}</strong>,
  },
  {
    Header: 'Trazabilidad',
    accessor: 'traceabilitySummary',
    minWidth: '200px',
    cell: ({ row }) => <TraceabilityCell row={row} />,
  },
];

export const AccountsPayableTable = ({
  canManageControlAction,
  canRegisterPayments,
  controlAccessDeniedMessage,
  emptyReason = 'filtered',
  groupBy,
  hasError = false,
  loading,
  onClearFilters,
  onToggleAllRowsSelection,
  onToggleRowSelection,
  onOpenDetail,
  onOpenPayments,
  onOpenPurchase,
  onManageControl,
  onRegisterPayment,
  rows,
  selectedRowIds,
}: AccountsPayableTableProps) => {
  const data: AccountsPayableTableRow[] = rows.map((row) => ({
    ...row,
    actions: row,
  }));

  const groupedBy =
    groupBy === 'provider'
      ? 'providerGroup'
      : groupBy === 'aging'
        ? 'agingGroup'
        : null;

  const selectedRowsCount = rows.reduce(
    (count, row) => count + (selectedRowIds.has(row.id) ? 1 : 0),
    0,
  );
  const allRowsSelected = rows.length > 0 && selectedRowsCount === rows.length;
  const someRowsSelected = selectedRowsCount > 0 && !allRowsSelected;
  const emptyText = loading ? (
    'Cargando CxP...'
  ) : hasError ? (
    'No se pudo confirmar CxP.'
  ) : (
    <EmptyStateContent>
      <strong>
        {emptyReason === 'no_open'
          ? 'No hay obligaciones abiertas en CxP.'
          : 'No hay CxP que coincidan con los filtros actuales.'}
      </strong>
      <span>
        {emptyReason === 'no_open'
          ? 'Las cuentas aparecerán cuando una compra completada tenga balance pendiente y pase los controles de pago.'
          : 'Ajusta búsqueda, aging, revisión, fiscalidad o agrupación para ampliar el alcance visible.'}
      </span>
      {emptyReason === 'filtered' && onClearFilters ? (
        <Button size="small" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      ) : null}
    </EmptyStateContent>
  );
  const visibleRowsStatus = loading
    ? 'Cargando registros'
    : hasError
      ? 'Registros sin confirmar'
      : `${rows.length} registros visibles`;

  const selectionColumn = useMemo<ColumnConfig<AccountsPayableTableRow>>(
    () => ({
      Header: (
        <SelectionControl
          onClick={(event) => event.stopPropagation()}
          title="Seleccionar todas las CxP visibles"
        >
          <Checkbox
            aria-label="Seleccionar todas las cuentas por pagar visibles"
            checked={allRowsSelected}
            disabled={rows.length === 0}
            indeterminate={someRowsSelected}
            onChange={(event) => onToggleAllRowsSelection(event.target.checked)}
          />
        </SelectionControl>
      ),
      accessor: 'selection',
      minWidth: '48px',
      maxWidth: '48px',
      keepWidth: true,
      clickable: false,
      sortable: false,
      cell: ({ row }) => {
        const accountsPayableRow = row as AccountsPayableRow;

        return (
          <SelectionControl
            onClick={(event) => event.stopPropagation()}
            title={`Seleccionar CxP ${accountsPayableRow.reference}`}
          >
            <Checkbox
              aria-label={`Seleccionar cuenta por pagar ${accountsPayableRow.reference}`}
              checked={selectedRowIds.has(accountsPayableRow.id)}
              onChange={(event) =>
                onToggleRowSelection(accountsPayableRow, event.target.checked)
              }
            />
          </SelectionControl>
        );
      },
    }),
    [
      allRowsSelected,
      onToggleAllRowsSelection,
      onToggleRowSelection,
      rows.length,
      selectedRowIds,
      someRowsSelected,
    ],
  );

  const actionColumn = useMemo<ColumnConfig<AccountsPayableTableRow>>(
    () => ({
      Header: ' ',
      accessor: 'actions',
      minWidth: '56px',
      maxWidth: '56px',
      keepWidth: true,
      fixed: 'right',
      cell: ({ value }) => (
        <RowActions
          row={value as AccountsPayableRow}
          onOpenDetail={onOpenDetail}
          onOpenPayments={onOpenPayments}
          onOpenPurchase={onOpenPurchase}
          onManageControl={onManageControl}
          onRegisterPayment={onRegisterPayment}
          canRegisterPayments={canRegisterPayments}
          canManageControlAction={canManageControlAction}
          controlAccessDeniedMessage={controlAccessDeniedMessage}
        />
      ),
    }),
    [
      canRegisterPayments,
      canManageControlAction,
      controlAccessDeniedMessage,
      onManageControl,
      onOpenDetail,
      onOpenPayments,
      onOpenPurchase,
      onRegisterPayment,
    ],
  );

  const tableColumns = useMemo(
    () => [selectionColumn, ...columns, actionColumn],
    [actionColumn, selectionColumn],
  );

  return (
    <AdvancedTable
      columns={tableColumns}
      data={data}
      emptyText={emptyText}
      footerLeftSide={
        <FooterInfo>
          <VisibleRowsInfo>{visibleRowsStatus}</VisibleRowsInfo>
          {selectedRowsCount > 0 ? (
            <SelectedRowsInfo>
              {selectedRowsCount} seleccionada
              {selectedRowsCount === 1 ? '' : 's'}
            </SelectedRowsInfo>
          ) : null}
        </FooterInfo>
      }
      groupBy={groupedBy}
      loading={loading}
      onRowClick={(row) => onOpenDetail(row)}
      rowBorder="#e5e7eb"
      rowSize="large"
      showPagination
      tableName="accounts-payable-table"
    />
  );
};

const AgingPill = styled.span<{
  $tone: 'danger' | 'warning' | 'neutral' | 'success';
}>`
  display: inline-flex;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(255, 77, 79, 0.12)'
      : $tone === 'warning'
        ? 'rgba(250, 173, 20, 0.14)'
        : $tone === 'success'
          ? 'rgba(82, 196, 26, 0.12)'
          : 'rgba(140, 140, 140, 0.12)'};
  color: ${({ $tone }) =>
    $tone === 'danger'
      ? '#cf1322'
      : $tone === 'warning'
        ? '#ad6800'
        : $tone === 'success'
          ? '#389e0d'
          : '#595959'};
  font-size: 12px;
  font-weight: 600;
`;

const TraceabilityBlock = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: var(--ds-color-text-primary, #111);
  }

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
  }
`;

const FiscalBlock = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--ds-color-text-primary, #111);
  }

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
  }
`;

const PaymentControlBlock = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const AccountingBlock = styled(PaymentControlBlock)`
  span {
    overflow: hidden;
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ControlPill = styled.span<{
  $tone: 'danger' | 'warning' | 'neutral' | 'success';
}>`
  display: inline-flex;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(255, 77, 79, 0.12)'
      : $tone === 'warning'
        ? 'rgba(250, 173, 20, 0.14)'
        : $tone === 'success'
          ? 'rgba(82, 196, 26, 0.12)'
          : 'rgba(140, 140, 140, 0.12)'};
  color: ${({ $tone }) =>
    $tone === 'danger'
      ? '#cf1322'
      : $tone === 'warning'
        ? '#ad6800'
        : $tone === 'success'
          ? '#389e0d'
          : '#595959'};
  font-size: 12px;
  font-weight: 600;
`;

const ControlReason = styled.span`
  max-width: 220px;
  overflow: hidden;
  color: var(--ds-color-text-secondary, #666);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled(Button)`
  min-width: 36px;
  min-height: 36px;
  padding-inline: 0;
  justify-content: center;

  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
  }
`;

const SelectionControl = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
  line-height: 1;

  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
  }
`;

const EmptyStateContent = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  max-width: 520px;
  margin-inline: auto;
  color: var(--ds-color-text-secondary, #666);
  text-align: center;

  strong {
    color: var(--ds-color-text-primary, #111);
    font-size: 14px;
  }

  span {
    max-width: 60ch;
    font-size: 13px;
    line-height: 1.45;
    text-wrap: pretty;
  }
`;

const FooterInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  min-width: 0;
`;

const VisibleRowsInfo = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--ds-color-text-secondary, #666);
  white-space: nowrap;

  @media (width <= 600px) {
    display: none;
  }
`;

const SelectedRowsInfo = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 2px 8px;
  border: 1px solid rgb(24 144 255 / 20%);
  border-radius: 999px;
  background: rgb(24 144 255 / 8%);
  color: #0958d9;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
`;
