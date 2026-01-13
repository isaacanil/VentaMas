import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbGetPreorders } from '@/firebase/invoices/fbGetPreorders';
import { InvoicePanel } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { InvoiceClient } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import Layout from './components/Layout/Layout';
import { PreSaleTable } from './components/PreSaleTable/PreSaleTable';
import SearchBar from './components/SearchBar/SearchBar';
import type {
  PreorderClientOption,
  PreorderFirestoreDoc,
} from './types';

const SearchContainer = styled.div`
  margin: 1rem;
`;

export const Preorder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientState, setSelectedClientState] = useState('all');
  const [preorders, setPreorders] = useState<PreorderFirestoreDoc[]>([]);
  const user = useSelector(selectUser) as UserIdentity | null;

  useEffect(() => {
    if (!user || !user.businessID) return;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let unsubscribe = () => { };
    fbGetPreorders(user, setPreorders).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      unsubscribe();
    };
  }, [user]);

  const getClientIdentifier = useCallback((client: InvoiceClient | null) => {
    const rawIdentifier =
      client?.id ??
      (client as { clientId?: unknown })?.clientId ??
      (client as { uid?: unknown })?.uid ??
      (client as { cedula?: unknown })?.cedula ??
      (client as { rnc?: unknown })?.rnc ??
      (client as { phone?: unknown })?.phone ??
      (client as { email?: unknown })?.email ??
      client?.name ??
      null;

    if (rawIdentifier === null || rawIdentifier === undefined) {
      return null;
    }

    return String(rawIdentifier);
  }, []);

  const normalizeString = useCallback((value: unknown) => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  }, []);

  const clientOptions = useMemo<PreorderClientOption[]>(() => {
    const uniqueClients = new Map<string, PreorderClientOption>();
    preorders.forEach((preorder) => {
      const client = preorder?.data?.client;
      const name = client?.name;
      if (!name || !String(name).trim()) return;
      const identifier = getClientIdentifier(client ?? null);
      if (!identifier || uniqueClients.has(identifier)) return;
      uniqueClients.set(identifier, {
        value: identifier,
        label: String(name),
      });
    });
    return Array.from(uniqueClients.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [getClientIdentifier, preorders]);

  const clientOptionsKey = useMemo(() => {
    const values = clientOptions.map((option) => option.value);
    values.sort();
    return values.join('|');
  }, [clientOptions]);

  const selectedClient = useMemo(() => {
    if (selectedClientState === 'all') return 'all';
    const exists = clientOptions.some(
      (option) => option.value === selectedClientState,
    );
    return exists ? selectedClientState : 'all';
  }, [clientOptions, selectedClientState]);

  const filteredPreventas = useMemo(() => {
    const lowerTerm = searchTerm.trim().toLowerCase();
    return preorders.filter((preorder) => {
      const data = preorder?.data;
      if (!data) return false;

      const client = data.client ?? null;
      const clientIdentifier = getClientIdentifier(client);
      if (selectedClient !== 'all' && clientIdentifier !== selectedClient) {
        return false;
      }

      if (!lowerTerm) {
        return true;
      }

      const clientName = normalizeString(client?.name);
      const numberID = normalizeString(data?.preorderDetails?.numberID);
      const productos = (data?.products || [])
        .map((prod) => normalizeString(prod?.name))
        .filter(Boolean)
        .join(' ');

      return (
        clientName.includes(lowerTerm) ||
        numberID.includes(lowerTerm) ||
        productos.includes(lowerTerm)
      );
    });
  }, [
    getClientIdentifier,
    normalizeString,
    preorders,
    searchTerm,
    selectedClient,
  ]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleClientChange = useCallback((clientId?: string | null) => {
    setSelectedClientState(clientId ?? 'all');
  }, []);

  return (
    <Container>
      <MenuApp sectionName={'Pre-ventas'} />
      <Layout>
        <SearchContainer>
          <SearchBar
            searchTerm={searchTerm}
            onSearch={handleSearch}
            clients={clientOptions}
            selectedClient={selectedClient}
            onClientChange={handleClientChange}
            key={clientOptionsKey}
          />
        </SearchContainer>
        <PreSaleTable preSales={filteredPreventas} searchTerm={searchTerm} />
      </Layout>
      <InvoicePanel />
    </Container>
  );
};

const Container = styled.div`
  max-height: 100vh;
  overflow: hidden;
`;

