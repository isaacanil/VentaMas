import React, { useEffect, useState } from 'react'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import Layout from './components/Layout/Layout'
import styled from 'styled-components'
import SearchBar from './components/SearchBar/SearchBar';
import { PreSaleTable } from './components/PreSaleTable/PreSaleTable';
import { fbGetPreorders } from '../../../firebase/invoices/fbGetPreorders';
import { selectUser } from '../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { InvoicePanel } from '../../component/cart/components/InvoicePanel/InvoicePanel';

const SearchContainer = styled.div`
  margin: 1rem;
`;

export const Preorder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPreventas, setFilteredPreventas] = useState();
  const [preorders, setPreorders] = useState([]);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user || !user.businessID) return;
    let unsubscribe = () => { };
    fbGetPreorders(user, setPreorders)
      .then((unsub) => { unsubscribe = unsub; });
    return () => { unsubscribe() };
  }, [user]);

  const handleSearch = (term) => {
    const lowerTerm = term.toLowerCase();
    setSearchTerm(term);
    const filtered = preorders.filter(preorder => {
      const clientName = preorder?.data?.client?.name?.toLowerCase();
      // const numberID = preorder?.data?.preorderDetails?.numberID?.toLowerCase();
      const productos = preorder?.data?.products?.map(prod => prod?.name?.toLowerCase())?.join(' ');
      return (
        clientName.includes(lowerTerm) ||
        productos.includes(lowerTerm)
      );
    });
    setFilteredPreventas(filtered);
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [preorders, searchTerm]);

  return (
    <Container>
      <MenuApp sectionName={"Pre-ventas"} />
      <Layout>
        <SearchContainer>
          <SearchBar searchTerm={searchTerm} onSearch={handleSearch} />
        </SearchContainer>
        <PreSaleTable
          preSales={filteredPreventas}
          searchTerm={searchTerm}
        />
      </Layout>
      <InvoicePanel />
    </Container>
  )
}

const Container = styled.div`
  max-height: 100vh;
  overflow: hidden;
`