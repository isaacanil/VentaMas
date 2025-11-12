import React from 'react';

import { AdvancedTable } from '../../../../../templates/system/AdvancedTable/AdvancedTable';

import { tableConfig } from './tableConfig';

export const ClientsListTable = ({ clients = [] }) => {
  const { columns, filterConfig } = tableConfig();
  const data = clients.map(({ client }) => {
    return {
      id: client.id,
      name: client.name,
      phone: client.tel,
      rnc: client.personalID,
      address: client.address,
      actions: client,
    };
  });

  return (
    <AdvancedTable
      data={data}
      columns={columns}
      filterUI
      filterConfig={filterConfig}
    />
  );
};
