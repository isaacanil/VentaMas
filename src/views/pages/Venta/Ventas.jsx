import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'

import { Cart } from '../../component/cart/cart.jsx'
import { MenuApp } from '../../templates/MenuApp/MenuApp.jsx'
import { MenuComponents } from '../../templates/MenuComponents/MenuComponents.jsx'  

import { selectCategoryGrouped } from '../../../features/setting/settingSlice'
import { useGetProducts } from '../../../firebase/products/fbGetProducts'
import useFilter from '../../../hooks/search/useSearch' // Cambiar importación
import { addProduct, resetCart, toggleCart, SelectSettingCart, SelectCartData } from '../../../features/cart/cartSlice'
import { useBarcodeScanner } from '../../../hooks/barcode/useBarcodeScanner'
import { motion } from 'framer-motion'
import { ProductControlEfficient } from './components/ProductControl.jsx/ProductControlEfficient.jsx'
import { extractProductInfo, extractWeightInfo, formatWeight } from '../../../utils/barcode.js'
import { notification } from 'antd'
import { InvoicePanel } from '../../component/cart/components/InvoicePanel/InvoicePanel.jsx'
import { clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice.js'
import { deleteClient } from '../../../features/clientCart/clientCartSlice.js'

import { ProductBatchModal } from '../Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.jsx'
import { selectUser } from '../../../features/auth/userSlice.js'
import { ClientSelector } from '../../component/contact/ClientControl/ClientSelector/ClientSelector.jsx'
import useViewportWidth from '../../../hooks/windows/useViewportWidth.jsx'

export const Sales = () => {
  const [searchData, setSearchData] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector(selectUser);
  const categoryGrouped = useSelector(selectCategoryGrouped)
  const { products, loading: productsLoading, setLoading, error } = useGetProducts()
  const cartSettings = useSelector(SelectSettingCart);
  const cartData = useSelector(SelectCartData);

  const viewport = useViewportWidth();
  const dispatch = useDispatch()

  const checkBarcode = (products, barcode) => {
    if (products.length <= 0) {
      notification.error({
        message: 'Error al escanear',
        description: `Error al cargar los productos, por favor intente de nuevo.`,
        placement: 'top'
      });
      return;
    }

    const product = products.find((p) => p?.barcode === barcode || p?.barcode === extractProductInfo(barcode));

    if (!product) {
      notification.error({
        message: 'Producto no encontrado',
        description: `El producto con el código de barras ${barcode} no existe.`,
        placement: 'top'
      });
      return;
    }

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
      notification.success({
        message: 'Producto agregado',
        description: `${productData.name} ${productData.weightDetail.weight}`,
        placement: 'top',
        duration: 3,
      });
      dispatch(addProduct(productData));
    } else {
      dispatch(addProduct(product));
    }
  };


  useBarcodeScanner(products, checkBarcode);

  const productFiltered = useFilter(products, searchData)
  const filterProductsByVisibility = productFiltered.filter((product) => product.isVisible !== false);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    const initialMode = searchParams.get('mode');
    const isPreorderContext = initialMode === 'preorder' || cartData?.type === 'preorder';

    if (!isPreorderContext) {
      if (viewport <= 800) dispatch(toggleCart());
      dispatch(resetCart());
      dispatch(clearTaxReceiptData());
      dispatch(deleteClient());
    }

    hasInitializedRef.current = true;
  }, [cartData?.type, dispatch, searchParams, viewport])

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const currentMode = params.get('mode');
    const billingMode = cartSettings?.billing?.billingMode;
    const hasPreorderLoaded = cartData?.type === 'preorder';
    const desiredMode = hasPreorderLoaded || billingMode === 'deferred' ? 'preorder' : 'sale';
    let hasChanges = false;

    if (currentMode !== desiredMode) {
      params.set('mode', desiredMode);
      hasChanges = true;
    }

    if (desiredMode !== 'preorder' && params.has('preorderId')) {
      params.delete('preorderId');
      hasChanges = true;
    }

    if (hasChanges) {
      setSearchParams(params, { replace: true });
    }
  }, [cartData?.type, cartSettings?.billing?.billingMode, searchParams, setSearchParams])

  return (
    <>
      <ClientSelector />
      <Container
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 0 }}
      >
        <ProductContainer>
          <MenuApp
            displayName='Productos'
            borderRadius={'bottom-right'}
            searchData={searchData}
            setSearchData={setSearchData}
            showNotificationButton={true}
          />
          < ProductControlEfficient
            productsLoading={productsLoading}
            products={filterProductsByVisibility}
          />
          <MenuComponents />
        </ProductContainer>
        <Cart />
        <InvoicePanel />
        <ProductBatchModal />
      </Container>
    </>
  )
}

const Container = styled(motion.div)`
  height: 100%;
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
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
`
