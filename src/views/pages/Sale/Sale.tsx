import { notification } from 'antd';
import { motion } from 'framer-motion';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useDeferredValue,
  memo,
  useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  addProduct,
  resetCart,
  toggleCart,
  SelectSettingCart,
  SelectCartData,
} from '@/features/cart/cartSlice';
import { deleteClient } from '@/features/clientCart/clientCartSlice';
import { clearTaxReceiptData } from '@/features/taxReceipt/taxReceiptSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { useBarcodeScanner } from '@/hooks/barcode/useBarcodeScanner';
import useFilter from '@/hooks/search/useSearch'; // Cambiar importación
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import {
  extractProductInfo,
  extractWeightInfo,
  formatWeight,
} from '@/utils/barcode';
import { ClientSelector } from '@/views/component/contact/ClientControl/ClientSelector/ClientSelector';
import { ProductBatchModal } from '@/views/pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';
import { MenuComponents } from '@/views/templates/MenuComponents/MenuComponents';

import { Cart } from './components/Cart/Cart';
import { InvoicePanel } from './components/Cart/components/InvoicePanel/InvoicePanel';
import { CashRegisterAlertModal } from './components/modals/CashRegisterAlertModal';
import { ProductControlEfficient } from './components/ProductControl/ProductControlEfficient';

import type { Dispatch, SetStateAction, JSX } from 'react';
import type { ComponentType, ReactNode } from 'react';

interface Product {
  barcode?: string;
  weightDetail?: {
    isSoldByWeight?: boolean;
    weight?: string | number;
    [key: string]: unknown;
  } | null;
  name?: string;
  isVisible?: boolean;
  [key: string]: unknown;
}

interface MenuAppProps {
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
}

interface CartSettings {
  billing?: {
    billingMode?: string | null;
  } | null;
}

interface CartData {
  type?: string | null;
}

interface ProductsResponse {
  products: Product[];
  loading: boolean;
  stockMeta: Record<string, unknown>;
}

const MenuAppComponent = memo(MenuApp) as ComponentType<MenuAppProps>;
const ProductControlEfficientMemo = memo(ProductControlEfficient);

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


  const { status: cashRegisterStatus } = useIsOpenCashReconciliation() as {
    status: string | boolean;
  };

  // Mantenemos null como estado inicial para que el primer valor real dispare la alerta al cargar
  const [prevStatus, setPrevStatus] = useState<string | boolean | null>(null);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  // Verificamos si cambió el status directamente en el cuerpo de la función
  if (cashRegisterStatus !== prevStatus) {
    setPrevStatus(cashRegisterStatus);
    // Si la condición se cumple, actualizamos el estado inmediatamente.
    if (
      cashRegisterStatus &&
      cashRegisterStatus !== 'open' &&
      typeof cashRegisterStatus === 'string'
    ) {
      setIsCashRegisterModalOpen(true);
    }
  }
  // --- FIX END ---

  const [searchData, setSearchData] = useState('');
  const deferredSearchData = useDeferredValue(searchData);

  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    loading: productsLoading,
    stockMeta,
  } = parseProductsResponse(useGetProducts('sales'));

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

  // NOTA: El useEffect que causaba el error ha sido eliminado y reemplazado 
  // por la lógica "FIX START" arriba.

  // NOTA: El bloqueo de clics ahora se maneja mediante un overlay en ProductControlEfficient


  const checkBarcode = useCallback(
    (products: Product[], barcode: string) => {
      if (
        cashRegisterStatus !== 'open' &&
        typeof cashRegisterStatus === 'string'
      ) {
        setIsCashRegisterModalOpen(true);
        return;
      }

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
    },
    [dispatch, cashRegisterStatus],
  );

  useBarcodeScanner(productsList, checkBarcode);

  const filteredProducts = ensureProductArray(
    useFilter(productsList, deferredSearchData),
    productsList,
  );
  const filterProductsByVisibility = useMemo(
    () => filteredProducts.filter((product) => product.isVisible !== false),
    [filteredProducts],
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
          <ProductControlEfficientMemo
            productsLoading={productsLoading}
            products={filterProductsByVisibility}
            statusMeta={statusMeta}
            isLocked={cashRegisterStatus !== 'open' && typeof cashRegisterStatus === 'string'}
            onLockedClick={() => setIsCashRegisterModalOpen(true)}
          />
          <MenuComponents />
        </ProductContainer>
        <Cart />
      </Container>
      <InvoicePanel />
      <ProductBatchModal />
      <CashRegisterAlertModal
        open={isCashRegisterModalOpen}
        onClose={() => setIsCashRegisterModalOpen(false)}
        status={cashRegisterStatus}
      />
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
