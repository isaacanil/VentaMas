// @ts-nocheck
import { Table, Checkbox, Typography, Empty } from 'antd';
import React from 'react';
import styled from 'styled-components';

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
}) => {
  // Columnas para la tabla de cuentas por cobrar
  const columns = [
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
      render: (_, record) => (
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
      render: (text) => <Text ellipsis>{text}</Text>,
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      width: '15%',
      render: (date) => formatDate(date),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: '15%',
      render: (amount) => formatCurrency(amount),
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
      account.date ||
      account.ver?.account?.invoice?.data?.date?.seconds * 1000 ||
      account.ver?.account?.createdAt?.seconds * 1000,
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
