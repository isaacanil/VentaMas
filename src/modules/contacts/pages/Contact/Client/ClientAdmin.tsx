import React, { Fragment, useMemo, useState } from 'react';
import styled from 'styled-components';

import { FilterBar } from '@/components/common/FilterBar/FilterBar';
import { useFbGetClients } from '@/firebase/client/useFbGetClients';
import { filterData } from '@/hooks/search/useSearch';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { ClientsListTable } from './components/OrderListTable/ClientsListTable';

type ClientsHookResult = ReturnType<typeof useFbGetClients>;
type ClientListItem = ClientsHookResult['clients'][number];

type ClientStatusFilter = 'active' | 'deleted' | 'all';

type ClientAdminFilters = {
  clientId: string;
  rnc: string;
  phone: string;
  status?: ClientStatusFilter;
};

type ClientOption = {
  value: string;
  label: string;
};

export const ClientAdmin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ClientAdminFilters>({
    clientId: '',
    rnc: '',
    phone: '',
    status: 'active',
  });
  const { clients } = useFbGetClients({ includeDeleted: true });
  const clientOptions = useMemo(() => {
    const safeClients = Array.isArray(clients) ? clients : [];
    return [
      { value: '', label: 'Todos' },
      ...safeClients
        .map(({ client }) =>
          client?.id && client?.name
            ? { value: String(client.id), label: client.name }
            : null,
        )
        .filter((option): option is ClientOption => Boolean(option)),
    ];
  }, [clients]);

  const filteredClients = useMemo(() => {
    const bySearch = filterData(clients, searchTerm) ?? [];
    return (bySearch as ClientListItem[]).filter(({ client, isDeleted }) => {
      const matchesClient =
        !filters.clientId ||
        String(client?.id ?? '') === filters.clientId;
      const matchesRnc =
        !filters.rnc ||
        `${client?.personalID || ''}`
          .toLowerCase()
          .includes(filters.rnc.toLowerCase());
      const matchesPhone =
        !filters.phone ||
        `${client?.tel || ''}`.toLowerCase().includes(filters.phone.toLowerCase());
      const matchesStatus =
        filters.status === 'all'
          ? true
          : filters.status === 'deleted'
            ? Boolean(isDeleted)
            : !isDeleted;
      return matchesClient && matchesRnc && matchesPhone && matchesStatus;
    });
  }, [
    clients,
    filters.clientId,
    filters.phone,
    filters.rnc,
    filters.status,
    searchTerm,
  ]);

  const hasActiveFilters =
    !!filters.clientId ||
    !!filters.rnc ||
    !!filters.phone ||
    filters.status !== 'active';

  const handleClearFilters = () =>
    setFilters({
      clientId: '',
      rnc: '',
      phone: '',
      status: undefined,
    });

  const filterItems = useMemo(
    () => [
      {
        key: 'client',
        section: 'main',
        label: 'Cliente',
        type: 'select',
        value: filters.clientId,
        onChange: (val?: string) =>
          setFilters((prev) => ({ ...prev, clientId: val || '' })),
        options: clientOptions,
        width: 200,
      },
      {
        key: 'rnc',
        section: 'main',
        label: 'RNC/Cédula',
        type: 'input',
        value: filters.rnc,
        onChange: (val?: string) =>
          setFilters((prev) => ({ ...prev, rnc: val || '' })),
        placeholder: 'Buscar documento',
        allowClear: true,
        props: { maxLength: 30 },
        minWidth: 200,
      },
      {
        key: 'phone',
        section: 'additional',
        label: 'Teléfono',
        type: 'input',
        value: filters.phone,
        onChange: (val?: string) =>
          setFilters((prev) => ({ ...prev, phone: val || '' })),
        placeholder: 'Buscar teléfono',
        allowClear: true,
        props: { maxLength: 20 },
        minWidth: 180,
      },
      {
        key: 'status',
        section: 'additional',
        label: 'Estado',
        type: 'select',
        value: filters.status,
        onChange: (val?: ClientStatusFilter | null) =>
          setFilters((prev) => ({ ...prev, status: val || 'active' })),
        options: [
          { label: 'Activos', value: 'active' },
          { label: 'Desactivados', value: 'deleted' },
          { label: 'Todos (incluye desactivados)', value: 'all' },
        ],
        allowClear: false,
        minWidth: 200,
      },
    ],
    [clientOptions, filters.clientId, filters.phone, filters.rnc, filters.status],
  );

  return (
    <Fragment>
      <MenuApp
        sectionName="Clientes"
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
        <BarWrapper>
          <FilterBar
            items={filterItems}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </BarWrapper>
        <ClientsListTable clients={filteredClients} />
      </Container>
    </Fragment>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100vw;
  height: calc(100vh - 2.75em);
  overflow: hidden;
  background-color: var(--color2);
`;

const BarWrapper = styled.div`
  padding: 0;
`;

