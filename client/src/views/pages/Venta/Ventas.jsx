import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  Cart,
  MenuApp,
  MenuComponents,
  MultiDisplayControl,
} from '../../'

import { selectCategoryGrouped } from '../../../features/setting/settingSlice'
import { useGetProducts } from '../../../firebase/products/fbGetProducts'
import { filterData } from '../../../hooks/search/useSearch'
import { addProduct, CancelShipping, toggleCart } from '../../../features/cart/cartSlice'
import { useBarcodeScanner } from '../../../hooks/barcode/useBarcodeScanner'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ProductControlEfficient } from './components/ProductControl.jsx/ProductControlEfficient.jsx'
import { extractProductInfo, extractWeightInfo, formatWeight } from '../../../utils/barcode.js'
import * as antd from 'antd'
import { InvoicePanel } from '../../component/cart/components/InvoicePanel/InvoicePanel.jsx'
import useViewportWidth from '../../../hooks/windows/useViewportWidth.jsx'
import { clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice.js'
import { deleteClient } from '../../../features/clientCart/clientCartSlice.js'

export const Sales = () => {
  const [searchData, setSearchData] = useState('')
  const categoryGrouped = useSelector(selectCategoryGrouped)
  const [cashCountConfirmation, setCashCountConfirmation] = useState(false)
  const { products, loading, setLoading, error } = useGetProducts()

  const viewport = useViewportWidth();
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const checkBarcode = (products, barcode) => {
    // Verificar si hay productos disponibles
    if (products.length <= 0) {
      antd.notification.error({
        message: 'Error al escanear',
        description: `Error al cargar los productos, por favor intente de nuevo.`,
        placement: 'top'
      });
      return;
    }

    // Intentar encontrar el producto basado en el código de barras
    const product = products.find((p) => p?.barcode === barcode || p?.barcode === extractProductInfo(barcode));

    if (!product) {
      antd.notification.error({
        message: 'Producto no encontrado',
        description: `El producto con el código de barras ${barcode} no existe.`,
        placement: 'top'
      });
      return;
    }

    // Verificar si el producto se vende por peso
    const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;

    if (barcode.startsWith('20') && barcode.length === 13 && isSoldByWeight) {
      const weightInfo = extractWeightInfo(barcode);
      const weight = formatWeight(weightInfo);

      const productData = {
        ...product,
        weightDetail: {
          ...product.weightDetail,
          weight: weight
        }
      };
      antd.notification.success({
        message: 'Producto agregado',
        description: `${productData.name} ${productData.weightDetail.weight}`,
        placement: 'top',
        duration: 3,
      });
      dispatch(addProduct(productData));
    } else {
      // Producto no vendido por peso o código de barras no cumple con los requisitos
      dispatch(addProduct(product));
    }
  };

  useBarcodeScanner(products, checkBarcode);

  const productFiltered = filterData(products, searchData)
  const filterProductsByVisibility = productFiltered.filter((product) => product.isVisible !== false);

  useEffect(() => {
    const handleCancelShipping = () => {
      if (viewport <= 800) dispatch(toggleCart());
      dispatch(CancelShipping())
      dispatch(clearTaxReceiptData())
      dispatch(deleteClient())
    }
    handleCancelShipping()
  }, [])

  return (
    <Container
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 0 }}
    >
      {/* <MultiDisplayControl></MultiDisplayControl> */}
      <ProductContainer>
        <MenuApp
          displayName='Productos'
          borderRadius={'bottom-right'}
          searchData={searchData}
          setSearchData={setSearchData}
        />
        {/* <ProductControl
          setProductsLoading={setLoading}
          productsLoading={loading}
          products={filterProductsByVisibility}
          isProductGrouped={categoryGrouped}
        /> */}
        < ProductControlEfficient
          products={filterProductsByVisibility}
        />
        <MenuComponents />
      </ProductContainer>
      <Cart />
      <InvoicePanel />
    </Container>
  )
}

const Container = styled(motion.div)`
  height: 100vh;
  display: grid;
  overflow-y: hidden;
  grid-template-columns: 1fr min-content;
  background-color: ${props => props.theme.bg.shade}; 
  gap: 0.4em;
  @media(max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 0;
}
  `
const ProductContainer = styled.div`
    display: grid;
    overflow: hidden;
    grid-template-rows: min-content min-content;
    @media(max-width: 800px) {
      position: relative;
      grid-template-rows: min-content min-content 1fr;
}
`