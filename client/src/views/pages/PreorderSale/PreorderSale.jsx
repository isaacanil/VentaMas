import React, { useEffect, useState } from 'react'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import Layout from './components/Layout/Layout'
import styled from 'styled-components'
import SearchBar from './components/SearchBar/SearchBar';
import PreventaList from './components/PreventaList/PreventaList';
import { PreSaleTable } from './components/PreSaleTable/PreSaleTable';
import { fbGetPreorders } from '../../../firebase/invoices/fbGetPreorders';
import { selectUser } from '../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { InvoicePanel } from '../../component/cart/components/InvoicePanel/InvoicePanel';

const preSales = [
  {
    data: {
      numberID: '001',
      NCF: 'NCF001',
      client: {
        name: 'Juan Pérez'
      },
      date: {
        seconds: 1711257600 // Timestamp en segundos (ejemplo: 22 de abril de 2024)
      },
      products: [
        {
          id: 'prod1',
          name: 'Producto A',
          price: 100.00,
          amountToBuy: 10,
          tax: 18.00, // ITBIS
        },
        {
          id: 'prod2',
          name: 'Producto B',
          price: 200.00,
          tax: 36.00,
          amountToBuy: 10,
        }
      ],
      status: 'completed', // Puede ser 'pending', 'completed' o 'cancelled'
      totalPurchase: {
        value: 436.00 // Total incluyendo impuestos
      }
    }
  },
  {
    data: {
      numberID: '002',
      NCF: 'NCF002',
      client: {
        name: 'María García'
      },
      date: {
        seconds: 1711344000 // Timestamp en segundos (ejemplo: 23 de abril de 2024)
      },
      products: [
        {
          id: 'prod3',
          name: 'Producto C',
          price: 150.00,
          amountToBuy: 10,
          tax: 27.00,
        }
      ],
      status: 'pending',
      totalPurchase: {
        value: 486.00
      }
    }
  },
  {
    data: {
      numberID: '003',
      NCF: 'NCF003',
      client: {
        name: 'Carlos López'
      },
      date: {
        seconds: 1711430400 // Timestamp en segundos (ejemplo: 24 de abril de 2024)
      },
      products: [
        {
          id: 'prod4',
          name: 'Producto D',
          amountToBuy: 10,
          price: 250.00,
          tax: 45.00,
        },
        {
          id: 'prod5',
          name: 'Producto E',
          amountToBuy: 65,
          price: 80.00,
          tax: 14.40,
        }
      ],
      status: 'cancelled',
      totalPurchase: {
        value: 379.40
      }
    }
  }
  // Puedes agregar más objetos de preventa según sea necesario
];


const SearchContainer = styled.div`
margin: 1rem;
`;

export const Preorder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPreventas, setFilteredPreventas] = useState(preSales);
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