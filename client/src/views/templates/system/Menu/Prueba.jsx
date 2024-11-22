
import React, { useRef, useState } from 'react';
import * as antd from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { Receipt } from '../../../pages/checkout/Receipt';
import invoice from './data.json'
// import { useGetWarehouseData } from '../../../../hooks/warehouse/useGetWarehouseData';
// import { fbFixProductsWithoutId } from '../../../../firebase/products/fbFixProductsWithoutId';
// import { GridVirtualizerFixed } from './ProductList';
import PurchaseManagement from '../../../pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement';
import styled from 'styled-components';
import Template2 from '../../../component/Receipts/Sale/Template2/Template2';
import InvoiceTemplates from '../../../component/Invoice/components/InvoiceTemplates/InvoiceTemplates';
import { InvoiceTemplate1 } from '../../../component/Invoice/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { InvoiceTemplate2 } from '../../../component/Invoice/templates/Invoicing/InvoiceTemplate2/InvoiceTemplate2';

const { FloatButton } = antd


export const Prueba = () => {
  const user = useSelector(selectUser)


  return (
    <Container>
    
      {/* <GridVirtualizerFixed /> */}
      <PurchaseManagement />
      {/* <Receipt data={invoice} ignoreHidden={true} />  */}
      {/* <FloatButton onClick={handleSubmit}>Corregir productos sin Id</FloatButton> */}
    </Container>
  )
}

const Container = styled.div`

`