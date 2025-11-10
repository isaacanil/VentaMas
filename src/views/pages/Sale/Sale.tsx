import { notification } from 'antd'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { selectUser } from '../../../features/auth/userSlice.js'
import { addProduct, resetCart, toggleCart, SelectSettingCart, SelectCartData } from '../../../features/cart/cartSlice'
import { deleteClient } from '../../../features/clientCart/clientCartSlice.js'
import { selectCategoryGrouped } from '../../../features/setting/settingSlice'
import { clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice.js'
import { useGetProducts } from '../../../firebase/products/fbGetProducts'
import { useBarcodeScanner } from '../../../hooks/barcode/useBarcodeScanner'
import { useCashCountClosingPrompt } from '../../../hooks/cashCount/useCashCountClosingPrompt'
import useFilter from '../../../hooks/search/useSearch' // Cambiar importación
import useViewportWidth from '../../../hooks/windows/useViewportWidth.jsx'
import { extractProductInfo, extractWeightInfo, formatWeight } from '../../../utils/barcode.js'
import { ClientSelector } from '../../component/contact/ClientControl/ClientSelector/ClientSelector.jsx'
import { MenuApp } from '../../templates/MenuApp/MenuApp.jsx'
import { MenuComponents } from '../../templates/MenuComponents/MenuComponents.jsx'
import { ProductBatchModal } from '../Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.jsx'

import { Cart } from './components/Cart/Cart'
import { InvoicePanel } from './components/Cart/components/InvoicePanel/InvoicePanel.jsx'
import { ProductControlEfficient } from './components/ProductControl.jsx/ProductControlEfficient.jsx'

import type { Dispatch, SetStateAction } from 'react'
import type { ComponentType, ReactNode } from 'react'

type Product = {
  barcode?: string
  weightDetail?: {
    isSoldByWeight?: boolean
    weight?: string | number
    [key: string]: unknown
  } | null
  name?: string
  isVisible?: boolean
  [key: string]: unknown
}

type MenuAppProps = {
  data?: unknown
  sectionName?: ReactNode
  sectionNameIcon?: ReactNode
  borderRadius?: string
  setSearchData?: Dispatch<SetStateAction<string>>
  searchData?: string
  displayName?: string
  showBackButton?: boolean
  showNotificationButton?: boolean
  onBackClick?: () => void
  onReportSaleOpen?: () => void
}

const MenuAppComponent = MenuApp as ComponentType<MenuAppProps>

export const Sales = (): JSX.Element => {
  useCashCountClosingPrompt();

  const [searchData, setSearchData] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector(selectUser);
  const categoryGrouped = useSelector(selectCategoryGrouped)
  const { products, loading: productsLoading, stockMeta = {} } = useGetProducts(false, 'sales')
  const cartSettings = useSelector(SelectSettingCart);
  const cartData = useSelector(SelectCartData);

  const viewport = useViewportWidth();
  const dispatch = useDispatch()

  const productsList = (products ?? []) as Product[]

  const checkBarcode = (products: Product[], barcode: string) => {
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

      const productData: Product = {
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


  useBarcodeScanner(productsList, checkBarcode);

  const filteredProducts = (useFilter(productsList, searchData) ?? []) as Product[]
  const filterProductsByVisibility = filteredProducts.filter((product) => product.isVisible !== false);
  const filteredVisibleStockTotal = useMemo(
    () =>
      filterProductsByVisibility.reduce(
        (sum, product) => sum + (Number(product?.stock ?? 0) || 0),
        0
      ),
    [filterProductsByVisibility]
  );
  const statusMeta = useMemo(
    () => ({
      ...stockMeta,
      productCount: filterProductsByVisibility.length,
      visibleStockTotal: filteredVisibleStockTotal,
    }),
    [stockMeta, filterProductsByVisibility.length, filteredVisibleStockTotal]
  );

  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    const initialMode = searchParams.get('mode');
    const shouldPreserveCart = searchParams.get('preserveCart') === '1';
    const shouldSkipCleanup = initialMode === 'preorder' || shouldPreserveCart;

    if (!shouldSkipCleanup) {
      if (viewport <= 800) dispatch(toggleCart());
      dispatch(resetCart());
      dispatch(clearTaxReceiptData());
      dispatch(deleteClient());
    }

    hasInitializedRef.current = true;

    if (shouldPreserveCart) {
      const cleanedParams = new URLSearchParams(searchParams);
      cleanedParams.delete('preserveCart');
      setSearchParams(cleanedParams, { replace: true });
    }
  }, [dispatch, searchParams, setSearchParams, viewport])

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
          <MenuAppComponent
            displayName='Productos'
            searchData={searchData}
            setSearchData={setSearchData}
            showNotificationButton={true}
          />
          <ProductControlEfficient
            productsLoading={productsLoading}
            products={filterProductsByVisibility}
            statusMeta={statusMeta}
          />
          <MenuComponents />
        </ProductContainer>
        <Cart />
      </Container>
      <InvoicePanel />
      <ProductBatchModal />
    </>
  )
}

const Container = styled(motion.div)`
  height: 100%;
  display: grid;
  overflow-y: hidden;
  grid-template-columns: 1fr min-content;
  background-color: ${props => props.theme.bg.shade}; 

  @media(max-width: 800px) {
    grid-template-columns: 1fr;

}
  `
const ProductContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
`
