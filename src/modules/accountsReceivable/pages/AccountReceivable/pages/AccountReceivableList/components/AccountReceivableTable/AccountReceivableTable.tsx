import React from 'react';

import useBusiness from '@/hooks/useBusiness';
import { formatPrice } from '@/utils/format';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';

import { getColumns } from './columns';

import type { AccountReceivableRow } from '@/utils/accountsReceivable/types';

type AccountReceivableRowRecord = AccountReceivableRow &
  Record<string, unknown>;

interface AccountReceivableTableProps {
  data?: AccountReceivableRow[];
  searchTerm?: string;
  totalBalance: number;
  showInsuranceColumn?: boolean;
  onRowClick?: (row: AccountReceivableRow) => void;
  loading?: boolean;
}

const EMPTY_ACCOUNTS_RECEIVABLE_ROWS: AccountReceivableRow[] = [];

export const AccountReceivableTable = ({
  data = EMPTY_ACCOUNTS_RECEIVABLE_ROWS,
  searchTerm = '',
  totalBalance,
  showInsuranceColumn, // Nueva prop para controlar la visibilidad de la columna de aseguradora
  onRowClick,
  loading,
}: AccountReceivableTableProps) => {
  const { isPharmacy } = useBusiness();

  // Si showInsuranceColumn está definido, lo usamos, de lo contrario depende de si es farmacia
  // Esto permite sobreescribir la lógica desde el componente padre
  const shouldShowInsuranceColumn =
    showInsuranceColumn !== undefined ? showInsuranceColumn : isPharmacy;

  const tableData = data as AccountReceivableRowRecord[];
  const handleRowClick = onRowClick
    ? (row: AccountReceivableRowRecord) => onRowClick(row)
    : undefined;

  return (
    <AdvancedTable
      columns={getColumns(shouldShowInsuranceColumn)}
      data={tableData}
      tableName="accountsReceivable-list"
      elementName="cuentas"
      searchTerm={searchTerm}
      footerLeftSide={`Total: ${formatPrice(totalBalance, '')}`}
      emptyText="No hay cuentas por cobrar para mostrar"
      onRowClick={handleRowClick}
      rowBorder="#e5e7eb"
      loading={loading}
    />
  );
};
