import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { selectUser } from '@/features/auth/userSlice';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';

import { getProviderColumns } from './columns';

import type { ProviderTableRow } from './types';

const EMPTY_PROVIDER_ROWS: ProviderTableRow[] = [];

export const ProviderTable = () => {
  const user = useSelector(selectUser);
  const { providers, loading } = useFbGetProviders(user);

  const tableData = providers.map(
    ({ provider }, index) =>
      ({
        ...provider,
        tableIndex: index,
      }) as ProviderTableRow,
  );

  return (
    <Container>
      <AdvancedTable
        columns={getProviderColumns()}
        data={tableData.length ? tableData : EMPTY_PROVIDER_ROWS}
        loading={loading}
        tableName="providers-list"
        elementName="proveedores"
        emptyText="No hay proveedores para mostrar"
        rowBorder="#e5e7eb"
        getRowId={(row) => row.id}
      />
    </Container>
  );
};

const Container = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  padding: 0 1.5rem 1.5rem;
  overflow: hidden;

  @media (width <= 768px) {
    padding: 0 1rem 1rem;
  }
`;
