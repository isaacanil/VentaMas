import { Table, Checkbox, Typography, Empty } from 'antd';
import React from 'react';
import styled from 'styled-components';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

import { toMillis } from '@/utils/date/toMillis';
import type { ProcessedAccountRow } from '../../../types';

const { Text } = Typography;

/**
 * Tabla de cuentas por cobrar para selección múltiple
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.accounts - Cuentas filtradas para mostrar
 * @param {boolean} props.allSelected - Indica si todas las cuentas están seleccionadas
 * @param {boolean} props.someSelected - Indica si algunas cuentas están seleccionadas
 * @param {Array} props.selectedAccounts - IDs de cuentas seleccionadas
 * @param {Function} props.onSelectAll - Función para manejar selección/deselección de todas las cuentas
 * @param {Function} props.onSelectAccount - Función para manejar selección/deselección de una cuenta
 * @param {Function} props.formatDate - Función para formatear fechas
 * @param {Function} props.formatCurrency - Función para formatear montos
 * @param {string} props.insuranceFilter - Filtro de aseguradora actual
 */
interface AccountsTableProps {
  accounts: ProcessedAccountRow[];
  allSelected: boolean;
  someSelected: boolean;
  selectedAccounts: string[];
  onSelectAll: (event: CheckboxChangeEvent) => void;
  onSelectAccount: (event: CheckboxChangeEvent, accountId: string) => void;
  formatDate: (value?: number | null) => string;
  formatCurrency: (value?: number | string | null) => string;
  insuranceFilter: string;
}

const AccountsTable = ({
  accounts,
  allSelected,
  someSelected,
  selectedAccounts,
  onSelectAll,
  onSelectAccount,
  formatDate,
  formatCurrency,
  insuranceFilter,
}: AccountsTableProps) => {
  // Columnas para la tabla de cuentas por cobrar
  const columns: ColumnsType<ProcessedAccountRow> = [
    {
      title: (
        <Checkbox
          onChange={onSelectAll}
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          disabled={insuranceFilter === 'none'}
        />
      ),
      dataIndex: 'select',
      key: 'select',
      width: '5%',
      render: (_value, record) => (
        <Checkbox
          checked={selectedAccounts.includes(record.ver.account.id)}
          onChange={(e) => onSelectAccount(e, record.ver.account.id)}
        />
      ),
    },
    {
      title: 'Factura',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: '10%',
    },
    {
      title: 'Cliente',
      dataIndex: 'client',
      key: 'client',
      width: '25%',
      render: (text: string) => <Text ellipsis>{text}</Text>,
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      width: '15%',
      render: (date: number | null) => formatDate(date),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: '15%',
      render: (amount: number | string) => formatCurrency(amount),
    },
    {
      title: 'NCF',
      dataIndex: 'ncf',
      key: 'ncf',
      width: '20%',
    },
  ];

  // Si no hay aseguradora seleccionada, mostrar estado vacío
  if (insuranceFilter === 'none') {
    return (
      <EmptyStateContainer>
        <Empty
          description="Seleccione una aseguradora para ver las cuentas por cobrar"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </EmptyStateContainer>
    );
  }

  // Preparar los datos para la tabla
  const tableData = accounts.map((account) => ({
    ...account,
    // Usar primero las propiedades directas del objeto si existen,
    // luego las propiedades anidadas como respaldo
    invoiceNumber:
      account.invoiceNumber ||
      account.ver?.account?.invoice?.data?.numberID ||
      'N/A',
    client:
      account.client ||
      account.ver?.account?.client?.name ||
      'Cliente sin nombre',
    date:
      toMillis(
        account.date ??
          account.ver?.account?.createdAt ??
          account.ver?.account?.account?.createdAt ??
          null,
      ) ?? null,
    balance: account.balance || 0,
    insurance:
      account.insurance ||
      account.ver?.account?.account?.insurance?.name ||
      'N/A',
    ncf: account.ncf || account.ver?.account?.invoice?.data?.NCF || 'N/A',
  }));

  return (
    <StyledTable
      columns={columns}
      dataSource={tableData}
      rowKey={(record) => record.ver.account.id}
      pagination={{
        pageSize: 5,
        showTotal: () => (
          <CountDisplay>
            <Text strong>
              seleccionadas {selectedAccounts.length}/{accounts.length}
            </Text>
          </CountDisplay>
        ),
      }}
      size="small"
      scroll={{ y: 250 }}
      locale={{ emptyText: 'No hay cuentas disponibles con el filtro actual' }}
    />
  );
};

const StyledTable = styled(Table)`
  /* Estilo minimalista, usando configuración por defecto de Ant Design */
`;

const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 250px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
`;

const CountDisplay = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export default AccountsTable;
