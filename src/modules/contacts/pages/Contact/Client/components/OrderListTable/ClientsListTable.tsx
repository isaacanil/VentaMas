import React from 'react';
import styled from 'styled-components';

import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';

import { useTableConfig } from './tableConfig';

type ClientRecord = {
  id?: string;
  name?: string;
  tel?: string;
  personalID?: string;
  address?: string;
  pendingBalance?: number;
};

type ClientListItem = {
  client: ClientRecord;
};

type ClientsListTableProps = {
  clients?: ClientListItem[];
};

const EMPTY_CLIENT_LIST_ITEMS: ClientListItem[] = [];

export const ClientsListTable = ({
  clients = EMPTY_CLIENT_LIST_ITEMS,
}: ClientsListTableProps) => {
  const { columns } = useTableConfig();
  const data = clients.map(({ client }) => {
    return {
      id: client.id,
      name: client.name,
      phone: client.tel,
      rnc: client.personalID,
      address: client.address,
      balance: client.pendingBalance ?? 0,
      actions: client,
    };
  });

  const emptyText = (
    <EmptyState>
      <h4>No hay clientes</h4>
      <p>Agrega un cliente con el botón superior derecho.</p>
    </EmptyState>
  );

  return (
    <AdvancedTable
      data={data}
      columns={columns}
      rowSize="large"
      emptyText={emptyText}
    />
  );
};

const EmptyState = styled.div`
  padding: 16px;
  text-align: center;
  color: #7a7a7a;

  h4 {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 600;
    color: #4c4c4c;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
`;
