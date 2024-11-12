
import React, { useRef, useState } from 'react';
import * as antd from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { Receipt } from '../../../pages/checkout/Receipt';
import invoice from './data.json'
// import { useGetWarehouseData } from '../../../../hooks/warehouse/useGetWarehouseData';
// import { fbFixProductsWithoutId } from '../../../../firebase/products/fbFixProductsWithoutId';
// import { GridVirtualizerFixed } from './ProductList';
// import PurchaseManagement from '../../../pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement';
import styled from 'styled-components';
import Template2 from '../../../component/Receipts/Sale/Template2/Template2';
import InvoiceTemplates from '../../../component/Invoice/components/InvoiceTemplates/InvoiceTemplates';
import { InvoiceTemplate1 } from '../../../component/Invoice/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { InvoiceTemplate2 } from '../../../component/Invoice/templates/Invoicing/InvoiceTemplate2/InvoiceTemplate2';
const { FloatButton } = antd
export const mockData = {
  business: {
    name: "Mi Empresa",
    address: "Calle Principal #123",
    phone: "809-555-5555",
    email: "correo@empresa.com",
    rnc: "123456789"
  },
  client: {
    name: "Cliente Ejemplo",
    address: "Av. Cliente #456",
    rnc: "987654321",
    code: "001"
  },
  items: [
    {
      key: '1',
      quantity: '2',
      code: '001',
      description: 'Producto Ejemplo 1',
      price: '100.00',
      discount: '0.00',
      itbis: '18.00',
      total: '236.00'
    },
 
   
    {
      key: '10',
      quantity: '2',
      code: '010',
      description: 'Producto Ejemplo 10',
      price: '140.00',
      discount: '0.00',
      itbis: '25.20',
      total: '305.20'
    },
    {
      key: '1',
      quantity: '2',
      code: '001',
      description: 'Producto Ejemplo 1',
      price: '100.00',
      discount: '0.00',
      itbis: '18.00',
      total: '236.00'
    },
    {
      key: '2',
      quantity: '1',
      code: '002',
      description: 'Producto Ejemplo 2',
      price: '150.00',
      discount: '5.00',
      itbis: '27.00',
      total: '172.00'
    },
    {
      key: '3',
      quantity: '5',
      code: '003',
      description: 'Producto Ejemplo 3',
      price: '80.00',
      discount: '10.00',
      itbis: '14.40',
      total: '404.40'
    },
    {
      key: '4',
      quantity: '3',
      code: '004',
      description: 'Producto Ejemplo 4',
      price: '120.00',
      discount: '0.00',
      itbis: '21.60',
      total: '381.60'
    },
    {
      key: '5',
      quantity: '4',
      code: '005',
      description: 'Producto Ejemplo 5',
      price: '95.00',
      discount: '5.00',
      itbis: '17.10',
      total: '392.10'
    },
    {
      key: '6',
      quantity: '2',
      code: '006',
      description: 'Producto Ejemplo 6',
      price: '200.00',
      discount: '0.00',
      itbis: '36.00',
      total: '436.00'
    },
    {
      key: '7',
      quantity: '6',
      code: '007',
      description: 'Producto Ejemplo 7',
      price: '75.00',
      discount: '10.00',
      itbis: '13.50',
      total: '453.50'
    },
    {
      key: '8',
      quantity: '3',
      code: '008',
      description: 'Producto Ejemplo 8',
      price: '110.00',
      discount: '5.00',
      itbis: '19.80',
      total: '344.80'
    },
    {
      key: '7',
      quantity: '6',
      code: '007',
      description: 'Producto Ejemplo 7',
      price: '75.00',
      discount: '10.00',
      itbis: '13.50',
      total: '453.50'
    },
    {
      key: '8',
      quantity: '3',
      code: '008',
      description: 'Producto Ejemplo 8',
      price: '110.00',
      discount: '5.00',
      itbis: '19.80',
      total: '344.80'
    },
    {
      key: '9',
      quantity: '1',
      code: '009',
      description: 'Producto Ejemplo 9',
      price: '180.00',
      discount: '10.00',
      itbis: '30.60',
      total: '200.60'
    },
    {
      key: '10',
      quantity: '2',
      code: '010',
      description: 'Producto Ejemplo 10',
      price: '140.00',
      discount: '0.00',
      itbis: '25.20',
      total: '305.20'
    },
  ],
  totals: {
    subtotal: "200.00",
    tax: "36.00",
    total: "236.00"
  },
  date: new Date().toLocaleDateString(),
  number: "001",
  type: "FACTURA",
  seller: {
    name: "Vendedor Ejemplo"
  }
};
export const Prueba = () => {
  const user = useSelector(selectUser)

  const handleSubmit = async () => {
    // try {
    //   await fbFixProductsWithoutId(user)
    //   console.log("Subido exitosamente")
    // } catch (error) {
    //   console.error("Error al arreglar ids de productos ", error)
    // }
  }


  return (
    <Container>  
      {/* <Template2 /> */}
      {/* <InvoiceTemplates  /> */}
      <InvoiceTemplate2 data={mockData} ignoreHidden />
      {/* <GridVirtualizerFixed /> */}
      {/* <PurchaseManagement /> */}
      {/* <Receipt data={invoice} ignoreHidden={true} />  */}
      {/* <FloatButton onClick={handleSubmit}>Corregir productos sin Id</FloatButton> */}
    </Container>
  )
}

const Container = styled.div`

`
