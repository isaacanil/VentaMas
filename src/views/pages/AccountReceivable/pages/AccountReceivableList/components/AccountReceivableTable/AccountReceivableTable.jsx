import React from 'react';

import useBusiness from '@/hooks/useBusiness';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';

import { getColumns } from './columns';

export const AccountReceivableTable = ({
  data = [],
  searchTerm = '',
  totalBalance,
  showInsuranceColumn, // Nueva prop para controlar la visibilidad de la columna de aseguradora
  onRowClick,
  loading,
}) => {
  const { isPharmacy } = useBusiness();

  // Si showInsuranceColumn está definido, lo usamos, de lo contrario depende de si es farmacia
  // Esto permite sobreescribir la lógica desde el componente padre
  const shouldShowInsuranceColumn =
    showInsuranceColumn !== undefined ? showInsuranceColumn : isPharmacy;

  return (
    <AdvancedTable
      columns={getColumns(shouldShowInsuranceColumn)}
      data={data}
      tableName="accountsReceivable-list"
      elementName="cuentas"
      searchTerm={searchTerm}
      footerLeftSide={`Total: ${totalBalance}`}
      emptyText="No hay cuentas por cobrar para mostrar"
      onRowClick={onRowClick}
      rowBorder="#e5e7eb"
      loading={loading}
    />
  );
};
