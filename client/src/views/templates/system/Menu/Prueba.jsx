
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as antd from 'antd';
import { fbAddRncData } from '../../../../firebase/rnc/fbAddRncData';
const { Table, Button, Input } = antd;
const { Search } = Input;
import styles from './invoice.module.css'
import { SearchOutlined } from '@ant-design/icons'
import Receipt from './Receipt';
import { InvoiceForm } from '../../../component/modals/InvoiceForm/InvoiceForm';
import { fbAddNumberIdToInvoices } from '../../../../firebase/invoices/fbAddNumberIdToInvoice';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { fbGetUser } from '../../../../firebase/Auth/fbGetUser';
import { Users } from '../../../controlPanel/AllUsersControl/components/Users/Users';
import { fbUpdateAllBusinessCashCounts } from '../../../../firebase/cashCount/fbUpdateMultipleCashCount';
import { fbTransferProductsToAnotherBusiness } from '../../../../firebase/products/fbTransferProductsToAnotherBusiness';
import { fbTransferCategoriesToAnotherBusiness } from '../../../../firebase/categories/fbTransferCategoriesToAnotherBusiness';
import { ProductControlEfficient } from '../../../pages/Venta/components/ProductControl.jsx/ProductControlEfficient';
import { useGetProducts } from '../../../../firebase/products/fbGetProducts';
import { fbUpdateProductsToNewFormatForMultipleBusinesses } from '../../../../firebase/products/fbChangeAllProducts';
import { getPriceWithoutTax, getProductsPrice, getTax, getTotalInvoice, getTotalPrice } from '../../../../utils/pricing';
import { fbChangeInvoiceForm } from './fbChangeInvoiceForm';
import { fbUpdateProductToNewFormat } from '../../../../firebase/products/fbUpdateProductWithNewFormat';
import { fbFixInvoices, fbPreviewProcessedInvoice } from '../../../../firebase/invoices/fbFixInvoice';
import { fbFixInvoicesForMultipleBusinesses } from '../../../../firebase/invoices/fbFixInvoicesMultiBusiness';
import { fbGetInvoice } from '../../../../firebase/invoices/fbGetInvoice';
import { fbCheckDuplicateProducts } from '../../../../firebase/products/fbCheckDuplicateProducts';
import { fbUpdateAppVersion } from '../../../../firebase/app/fbUpdateAppVersion';
import { fbDeleteProducts } from '../../../../firebase/products/fbDeleteProducts';
import { fbUpdateProductStructure } from '../../../../firebase/products/fbUpdateProductStructure';

const data = {
  companyName: "CASA ESTILO RF",
  companyAddress: "CALLE EUSEBIO MANZUETA, #104 CONSUELO, SANTO DOMINGO",
  companyPhone: "809-681-5318",
  companyRNC: "130340722",
  customerName: "COMERCIAL FERVEN SRL",
  customerRNC: "925477000003691",
  customerAddress: "C/ 3UCV0F-372",
  invoiceDate: "30-11-2023",
  invoiceNumber: "0000000000001359",
  user: "Alondra H.",
  items: [
    {
      id: 1,
      description: "1.00 x I. 350.00 CADENA",
      quantity: 1,
      price: 350.00,
      value: 350.00
    }
    // ... Puedes agregar más artículos aquí si es necesario
  ],
  subtotal: 1350.00,
  discount: 270.00,
  tax: 164.75,
  total: 1080.00,
  paymentMethod: "Efectivo",
  ncfValidity: "2024-12-31",
  additionalNotes: "No se aceptan devoluciones ni reclamos después de 7 días laborables.",
  thankYouNote: "Gracias por su compra"
};

const InvoiceContainer = styled.div`
  max-width: 8.5cm; 
  margin: auto;
  padding: 20px;
  background: white;
  border: 1px solid #ddd;
  font-family: 'Helvetica', 'Arial', sans-serif;
`;

const InvoiceHeader = styled.header`
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const CompanyName = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const CompanyAddress = styled.address`
  margin-bottom: 10px;
`;

const CustomerInfoSection = styled.section`
  margin-bottom: 20px;
`;

const InvoiceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f8f8f8;
    font-weight: bold;
  }
`;

const TotalsDiv = styled.div`
  text-align: right;
  margin-bottom: 20px;
`;

const InvoiceFooter = styled.footer`
  border-top: 2px solid #000;
  padding-top: 10px;
  text-align: center;
  font-size: 12px;
`;


export const Prueba = () => {
  const user = useSelector(selectUser)
  const [users, setUsers] = useState([])
  const handleSubmit = async () => {
    //await fbTransferProductsToAnotherBusiness("Lm8GG6YXQJO3zgR9DkGe", "vvRKlKT9UOK4fX9FgJxN")
    //await fbCheckDuplicateProducts("vvRKlKT9UOK4fX9FgJxN")
    //await fbUpdateProductStructure(user, "fMv08esuyb")
    //await fbFixInvoicesForMultipleBusinesses()
    //await fbFixInvoices("EDW44d69fhdvE5QmuL2I")
    //await fbPreviewProcessedInvoice("EDW44d69fhdvE5QmuL2I", "mbKZKk-ZQbPq")
    //await fbGetInvoice("JnKRSCFwKSkiSNSiIpOM", "3CvDJRH8PWP2")
  }
  return (
    <div>
      <Button
        onClick={handleSubmit}
      >
        Cambiar Estructura de Productos
      </Button>
    </div>
  )
}
<Receipt />


const ArticuloConImpuesto = () => {

  return (
    <div>



    </div>
  );
};
