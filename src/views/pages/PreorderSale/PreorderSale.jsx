import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../features/auth/userSlice';
import { fbGetPreorders } from '../../../firebase/invoices/fbGetPreorders';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import { InvoicePanel } from '../Sale/components/Cart/components/InvoicePanel/InvoicePanel';

import Layout from './components/Layout/Layout';
import { PreSaleTable } from './components/PreSaleTable/PreSaleTable';
import SearchBar from './components/SearchBar/SearchBar';

const SearchContainer = styled.div`
  margin: 1rem;
`;

export const Preorder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [filteredPreventas, setFilteredPreventas] = useState([]);
  const [preorders, setPreorders] = useState([]);
  const user = useSelector(selectUser);

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

  const getClientIdentifier = useCallback((client = {}) => {
    const rawIdentifier =
      client?.id ??
      client?.clientId ??
      client?.uid ??
      client?.cedula ??
      client?.rnc ??
      client?.phone ??
      client?.email ??
      client?.name ??
      null;

    if (rawIdentifier === null || rawIdentifier === undefined) {
      return null;
    }

    return String(rawIdentifier);
  }, []);

  const normalizeString = useCallback((value) => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  }, []);

  const clientOptions = useMemo(() => {
    const uniqueClients = new Map();
    preorders.forEach((preorder) => {
      const client = preorder?.data?.client;
      const name = client?.name;
      if (!name || !String(name).trim()) return;
      const identifier = getClientIdentifier(client);
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

  const applyFilters = useCallback(() => {
    const lowerTerm = searchTerm.trim().toLowerCase();
    const filtered = preorders.filter((preorder) => {
      const data = preorder?.data;
      if (!data) return false;

      const client = data.client || {};
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
    setFilteredPreventas(filtered);
  }, [
    getClientIdentifier,
    normalizeString,
    preorders,
    searchTerm,
    selectedClient,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleClientChange = useCallback((clientId) => {
    setSelectedClient(clientId ?? 'all');
  }, []);

  useEffect(() => {
    if (selectedClient === 'all') return;
    const exists = clientOptions.some(
      (option) => option.value === selectedClient,
    );
    if (!exists) {
      setSelectedClient('all');
    }
  }, [clientOptions, selectedClient]);

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
