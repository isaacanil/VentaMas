import { notification } from 'antd';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  addProduct,
  resetCart,
  toggleCart,
  SelectSettingCart,
  SelectCartData,
} from '../../../features/cart/cartSlice';
import { deleteClient } from '../../../features/clientCart/clientCartSlice.js';
import { clearTaxReceiptData } from '../../../features/taxReceipt/taxReceiptSlice.js';
import { useGetProducts } from '../../../firebase/products/fbGetProducts';
import { useBarcodeScanner } from '../../../hooks/barcode/useBarcodeScanner';
import { useCashCountClosingPrompt } from '../../../hooks/cashCount/useCashCountClosingPrompt';
import useFilter from '../../../hooks/search/useSearch'; // Cambiar importación
import useViewportWidth from '../../../hooks/windows/useViewportWidth.jsx';
import {
  extractProductInfo,
  extractWeightInfo,
  formatWeight,
} from '../../../utils/barcode.js';
import { ClientSelector } from '../../component/contact/ClientControl/ClientSelector/ClientSelector.jsx';
import { MenuApp } from '../../templates/MenuApp/MenuApp.jsx';
import { MenuComponents } from '../../templates/MenuComponents/MenuComponents.jsx';
import { ProductBatchModal } from '../Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.jsx';

import { Cart } from './components/Cart/Cart';
import { InvoicePanel } from './components/Cart/components/InvoicePanel/InvoicePanel.jsx';
import { ProductControlEfficient } from './components/ProductControl.jsx/ProductControlEfficient.jsx';

import type { Dispatch, SetStateAction, JSX } from 'react';
import type { ComponentType, ReactNode } from 'react';

type Product = {
  barcode?: string;
  weightDetail?: {
    isSoldByWeight?: boolean;
    weight?: string | number;
    [key: string]: unknown;
  } | null;
  name?: string;
  isVisible?: boolean;
  [key: string]: unknown;
};

type MenuAppProps = {
  data?: unknown;
  sectionName?: ReactNode;
  sectionNameIcon?: ReactNode;
  borderRadius?: string;
  setSearchData?: Dispatch<SetStateAction<string>>;
  searchData?: string;
  displayName?: string;
  showBackButton?: boolean;
  showNotificationButton?: boolean;
  onBackClick?: () => void;
  onReportSaleOpen?: () => void;
};

type CartSettings = {
  billing?: {
    billingMode?: string | null;
  } | null;
};

type CartData = {
  type?: string | null;
};

type ProductsResponse = {
  products: Product[];
  loading: boolean;
  stockMeta: Record<string, unknown>;
};

const MenuAppComponent = MenuApp as ComponentType<MenuAppProps>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isProduct = (value: unknown): value is Product => isRecord(value);

const parseProductsResponse = (value: unknown): ProductsResponse => {
  if (!isRecord(value)) {
    return { products: [], loading: false, stockMeta: {} };
  }
  const record: Record<string, unknown> = value;
  const productsCandidate = record.products;
  const loadingCandidate = record.loading;
  const stockMetaCandidate = record.stockMeta;
  const products = Array.isArray(productsCandidate)
    ? productsCandidate.filter(isProduct)
    : [];
  const loading =
    typeof loadingCandidate === 'boolean' ? loadingCandidate : false;
  const stockMeta = isRecord(stockMetaCandidate) ? stockMetaCandidate : {};
  return { products, loading, stockMeta };
};

const isCartSettings = (value: unknown): value is CartSettings => {
  if (!isRecord(value)) return false;
  const record: Record<string, unknown> = value;
  if (!('billing' in record)) return true;
  const billing = record.billing;
  if (billing == null) return true;
  if (!isRecord(billing)) return false;
  if (!('billingMode' in billing)) return true;
  const billingMode = billing.billingMode;
  return typeof billingMode === 'string' || billingMode === null;
};

const isCartData = (value: unknown): value is CartData => {
  if (!isRecord(value)) return false;
  const record: Record<string, unknown> = value;
  if (!('type' in record)) return true;
  const typeValue = record.type;
  return typeof typeValue === 'string' || typeValue === null;
};

const ensureProductArray = (value: unknown, fallback: Product[]): Product[] => {
  if (!Array.isArray(value)) return fallback;
  return value.filter(isProduct);
};

const resolveBackgroundShade = (theme: unknown): string => {
  if (isRecord(theme)) {
    const bg = theme.bg;
    if (isRecord(bg)) {
      const shade = bg.shade;
      if (typeof shade === 'string') return shade;
    }
  }
  return 'transparent';
};

const toWeightInfoString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const toWeightValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const Sales = (): JSX.Element => {
  useCashCountClosingPrompt();

  const [searchData, setSearchData] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    loading: productsLoading,
    stockMeta,
  } = parseProductsResponse(useGetProducts(false, 'sales'));
  const cartSettingsRaw: unknown = useSelector(SelectSettingCart);
  const cartSettings = isCartSettings(cartSettingsRaw)
    ? cartSettingsRaw
    : undefined;
  const cartDataRaw: unknown = useSelector(SelectCartData);
  const cartData = isCartData(cartDataRaw) ? cartDataRaw : undefined;

  const viewportValue: unknown = useViewportWidth();
  const viewport = typeof viewportValue === 'number' ? viewportValue : 0;
  const dispatch = useDispatch();

  const productsList = products;

  const checkBarcode = (products: Product[], barcode: string) => {
    if (products.length <= 0) {
      notification.error({
        title: 'Error al escanear',
        description: `Error al cargar los productos, por favor intente de nuevo.`,
        placement: 'top',
      });
      return;
    }

    const product = products.find(
      (p) =>
        p?.barcode === barcode || p?.barcode === extractProductInfo(barcode),
    );

    if (!product) {
      notification.error({
        title: 'Producto no encontrado',
        description: `El producto con el código de barras ${barcode} no existe.`,
        placement: 'top',
      });
      return;
    }

    const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;

    if (barcode.startsWith('20') && barcode.length === 13 && isSoldByWeight) {
      const weightInfo = toWeightInfoString(extractWeightInfo(barcode));
      const weight = toWeightValue(formatWeight(weightInfo));

      const productData: Product = {
        ...product,
        weightDetail: {
          ...product.weightDetail,
          weight: weight,
        },
      };
      notification.success({
        title: 'Producto agregado',
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

  const filteredProducts = ensureProductArray(
    useFilter(productsList, searchData),
    productsList,
  );
  const filterProductsByVisibility = filteredProducts.filter(
    (product) => product.isVisible !== false,
  );
  const filteredVisibleStockTotal = useMemo(
    () =>
      filterProductsByVisibility.reduce(
        (sum, product) => sum + (Number(product?.stock ?? 0) || 0),
        0,
      ),
    [filterProductsByVisibility],
  );
  const statusMeta = useMemo(
    () => ({
      ...stockMeta,
      productCount: filterProductsByVisibility.length,
      visibleStockTotal: filteredVisibleStockTotal,
    }),
    [stockMeta, filterProductsByVisibility.length, filteredVisibleStockTotal],
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
  }, [dispatch, searchParams, setSearchParams, viewport]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const currentMode = params.get('mode');
    const billingMode = cartSettings?.billing?.billingMode ?? undefined;
    const hasPreorderLoaded = cartData?.type === 'preorder';
    const desiredMode =
      hasPreorderLoaded || billingMode === 'deferred' ? 'preorder' : 'sale';
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
  }, [
    cartData?.type,
    cartSettings?.billing?.billingMode,
    searchParams,
    setSearchParams,
  ]);

  return (
    <>
      <ClientSelector />
      <Container
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 0 }}
      >
        <ProductContainer>
          <MenuAppComponent
            displayName="Productos"
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
  );
};

const Container = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr min-content;
  height: 100%;
  overflow-y: hidden;
  background-color: ${({ theme }: { theme: unknown }) =>
    resolveBackgroundShade(theme)};

  @media (width <= 800px) {
    grid-template-columns: 1fr;
  }
`;
const ProductContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;
