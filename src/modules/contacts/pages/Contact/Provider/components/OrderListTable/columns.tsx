import React from 'react';

import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { truncateString } from '@/utils/text/truncateString';

import { ProviderActionsCell } from './components/ProviderActionsCell';

import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { ProviderTableRow } from './types';

const formatProviderPhone = (phone?: string) =>
  phone ? formatPhoneNumber(phone) : 'Sin teléfono';

const formatProviderAddress = (address?: string) =>
  address ? truncateString(address, 56) : 'Sin dirección';

export const getProviderColumns = (): AdvancedTableColumn<ProviderTableRow>[] => [
  {
    Header: '#',
    accessor: 'tableIndex',
    align: 'left',
    minWidth: '72px',
    maxWidth: '0.45fr',
    cell: ({ row }) => {
      const index = Number(row.tableIndex ?? 0) + 1;
      return String(index).padStart(2, '0');
    },
  },
  {
    Header: 'Nombre',
    accessor: 'name',
    sortable: true,
    align: 'left',
    minWidth: '220px',
    maxWidth: '1.4fr',
    fixed: 'left',
    cell: ({ value }) => (typeof value === 'string' && value ? value : 'Sin nombre'),
  },
  {
    Header: 'RNC',
    accessor: 'rnc',
    sortable: true,
    align: 'left',
    minWidth: '140px',
    maxWidth: '0.9fr',
    cell: ({ value }) => (typeof value === 'string' && value ? value : 'Sin RNC'),
  },
  {
    Header: 'Teléfono',
    accessor: 'tel',
    align: 'left',
    minWidth: '160px',
    maxWidth: '1fr',
    cell: ({ value }) =>
      formatProviderPhone(typeof value === 'string' ? value : undefined),
  },
  {
    Header: 'Dirección',
    accessor: 'address',
    align: 'left',
    minWidth: '240px',
    maxWidth: '1.8fr',
    cell: ({ value }) =>
      formatProviderAddress(typeof value === 'string' ? value : undefined),
  },
  {
    Header: 'Acciones',
    accessor: 'actions',
    align: 'center',
    minWidth: '130px',
    maxWidth: '0.8fr',
    fixed: 'right',
    clickable: false,
    cell: ({ row }) => <ProviderActionsCell provider={row} />,
  },
];
