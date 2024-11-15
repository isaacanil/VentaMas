
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
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseconfig';
const { FloatButton } = antd

async function fbDisabledWeightUnitFromProducts (user) {
  if(!user.businessID){
    throw new Error('User does not have a business ID')
  }
  try {
    const productsRef = collection(db, 'businesses', user.businessID, 'products');
    const querySnapshot = await getDocs(productsRef);

    const updatePromises = querySnapshot.docs.map((productDoc) => {
      const productRef = doc(db, 'businesses', user.businessID, 'products', productDoc.id);
      return updateDoc(productRef, {
        'weightDetail.isSoldByWeight': false
      });
      
    });

    await Promise.all(updatePromises);
    console.log('All products updated successfully');
    alert('All products updated successfully')
  } catch (error) {
    console.error('Error updating products: ', error);
  }
  
}
 
export const Prueba = () => {
  const user = useSelector(selectUser)

  const handleSubmit = async () => {
    await fbDisabledWeightUnitFromProducts(user);
    // try {
    //   await fbFixProductsWithoutId(user)
    //   console.log("Subido exitosamente")
    // } catch (error) {
    //   console.error("Error al arreglar ids de productos ", error)
    // }
  }


  return (
    <Container>  
      <button onClick={handleSubmit}>Quitar </button>
      {/* <GridVirtualizerFixed /> */}
      <PurchaseManagement />
      {/* <Receipt data={invoice} ignoreHidden={true} />  */}
      {/* <FloatButton onClick={handleSubmit}>Corregir productos sin Id</FloatButton> */}
    </Container>
  )
}

const Container = styled.div`

`
