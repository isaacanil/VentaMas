import { notification } from 'antd';
import { m } from 'framer-motion';
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
import { resolveProductForCartDocumentCurrency } from '@/features/cart/utils/documentPricing';
import { deleteClient } from '@/features/clientCart/clientCartSlice';
import { selectCashRegisterAlertBypass } from '@/features/appModes/appModeSlice';
import { selectUser } from '@/features/auth/userSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { clearTaxReceiptData } from '@/features/taxReceipt/taxReceiptSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { useBarcodeScanner } from '@/hooks/barcode/useBarcodeScanner';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import type { MonetaryRateConfig } from '@/utils/accounting/lineMonetary';
import {
  extractWeightInfo,
  formatWeight,
  getBarcodeLookupCandidates,
  isVariableWeightBarcode,
  normalizeBarcodeDigits,
  normalizeBarcodeValue,
} from '@/utils/barcode';
import { resolveProductStockSelection } from '@/utils/inventory/productStockSelection';
import { ClientSelector } from '@/modules/contacts/components/ClientControl/ClientSelector/ClientSelector';
import { ProductBatchModal } from '@/modules/inventory/pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { MenuComponents } from '@/modules/sales/components/MenuComponents/MenuComponents';

import { Cart } from './components/Cart/Cart';
import { InvoicePanel } from './components/Cart/components/InvoicePanel/InvoicePanel';
import { CashRegisterAlertModal } from './components/modals/CashRegisterAlertModal';
import { ProductControlEfficient } from './components/ProductControl/ProductControlEfficient';
import {
  buildProductSearchIndex,
  normalizeProductSearchTerm,
} from './utils/productSearch';

import type { Dispatch, SetStateAction, JSX } from 'react';
import type { ProductRecord } from '@/types/products';
import type { UserIdentity } from '@/types/users';
import type { ComponentType, ReactNode } from 'react';

interface Product {
  barcode?: string | number;
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
  setSearchData?: Dispatch<SetStateAction<string>>;
  searchData?: string;
  displayName?: string;
  showBackButton?: boolean;
  showNotificationButton?: boolean;
  onBackClick?: () => void;
  onReportSaleOpen?: () => void;
  forceRender?: boolean;
}

interface CartSettings {
  isInvoicePanelOpen?: boolean;
  billing?: {
    billingMode?: string | null;
  } | null;
}

interface CartData {
  type?: string | null;
  documentCurrency?: SupportedDocumentCurrency | null;
  functionalCurrency?: SupportedDocumentCurrency | null;
  manualRatesByCurrency?: Partial<
    Record<SupportedDocumentCurrency, MonetaryRateConfig>
  > | null;
  products?: ProductRecord[] | null;
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

const normalizeProductRecord = (product: Product): ProductRecord => {
  const weightDetail = product.weightDetail;
  if (!weightDetail) return product as ProductRecord;
  return {
    ...(product as ProductRecord),
    weightDetail: {
      ...weightDetail,
      weight: toWeightValue(weightDetail.weight),
    },
  };
};

export const Sales = (): JSX.Element => {
  const { status: cashRegisterStatus } = useIsOpenCashReconciliation() as {
    status: string | 'loading';
  };
  const cashRegisterAlertBypass = useSelector(
    selectCashRegisterAlertBypass,
  ) as boolean;

  const [cashRegisterModalRequested, setCashRegisterModalRequested] =
    useState(false);
  const [dismissedCashRegisterStatus, setDismissedCashRegisterStatus] =
    useState<string | null>(null);

  const shouldBypassCashRegisterBlocking = cashRegisterAlertBypass;

  const isBlockingCashRegisterStatus =
    !shouldBypassCashRegisterBlocking &&
    typeof cashRegisterStatus === 'string' &&
    cashRegisterStatus !== 'open' &&
    cashRegisterStatus !== 'loading';

  const resolvedDismissedCashRegisterStatus = isBlockingCashRegisterStatus
    ? dismissedCashRegisterStatus
    : null;

  const shouldShowCashRegisterModal =
    isBlockingCashRegisterStatus &&
    resolvedDismissedCashRegisterStatus !== cashRegisterStatus;
  const isCashRegisterModalOpen =
    isBlockingCashRegisterStatus &&
    (cashRegisterModalRequested || shouldShowCashRegisterModal);

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
  const user = useSelector(selectUser) as UserIdentity | null;

  const productsList = products;
  const visibleProducts = useMemo(
    () => productsList.filter((product) => product.isVisible !== false),
    [productsList],
  );
  const indexedVisibleProducts = useMemo(
    () =>
      visibleProducts.map((product) => ({
        product,
        searchIndex: buildProductSearchIndex(product),
      })),
    [visibleProducts],
  );
  const normalizedSearchTerm = useMemo(
    () => normalizeProductSearchTerm(deferredSearchData),
    [deferredSearchData],
  );
  const currentCartCurrencies = Array.isArray(cartData?.products)
    ? cartData.products
        .map((item) => item?.monetary?.documentCurrency)
        .filter(
          (currency): currency is SupportedDocumentCurrency =>
            Boolean(currency),
        )
    : [];
  const productsByBarcode = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of productsList) {
      const normalizedBarcode = normalizeBarcodeValue(product?.barcode);
      if (!normalizedBarcode) continue;

      const barcodeCandidates = getBarcodeLookupCandidates(normalizedBarcode);
      for (const candidate of barcodeCandidates) {
        if (!map.has(candidate)) {
          map.set(candidate, product);
        }
      }
    }
    return map;
  }, [productsList]);

  // NOTA: El bloqueo de clics ahora se maneja mediante un overlay en ProductControlEfficient

  const dispatchResolvedScannedProduct = (product: ProductRecord) => {
    const documentCurrency = normalizeSupportedDocumentCurrency(
      cartData?.documentCurrency,
    );
    const resolution = resolveProductForCartDocumentCurrency(
      product,
      documentCurrency,
      {
        hasCartProducts: Array.isArray(cartData?.products)
          ? cartData.products.length > 0
          : false,
        functionalCurrency: normalizeSupportedDocumentCurrency(
          cartData?.functionalCurrency,
        ),
        manualRatesByCurrency: cartData?.manualRatesByCurrency ?? undefined,
        currentCartCurrencies,
      },
    );
    if (!resolution.eligible || !resolution.product) {
      notification.warning({
        title: 'Producto no elegible',
        description:
          resolution.reason ??
          'Este producto no puede agregarse con la moneda documental actual.',
        placement: 'top',
      });
      return false;
    }

    dispatch(addProduct(resolution.product));
    return true;
  };

  const checkBarcode = (barcode: string) => {
    if (!user) {
      notification.error({
        title: 'Usuario no disponible',
        description:
          'No se pudo validar el inventario del usuario actual. Intenta iniciar sesión nuevamente.',
        placement: 'top',
      });
      return;
    }

    if (isBlockingCashRegisterStatus) {
      setCashRegisterModalRequested(true);
      return;
    }

    if (productsLoading) {
      notification.warning({
        title: 'Cargando productos',
        description: 'Espera un momento y vuelve a escanear.',
        placement: 'top',
      });
      return;
    }

    if (productsList.length <= 0) {
      notification.error({
        title: 'Error al escanear',
        description: `Error al cargar los productos, por favor intente de nuevo.`,
        placement: 'top',
      });
      return;
    }

    const normalizedBarcode = normalizeBarcodeValue(barcode);
    if (!normalizedBarcode) {
      notification.error({
        title: 'Código inválido',
        description: 'No se pudo leer el código de barras.',
        placement: 'top',
      });
      return;
    }

    const scannedCandidates = getBarcodeLookupCandidates(normalizedBarcode);
    let product: Product | undefined;
    for (const candidate of scannedCandidates) {
      product = productsByBarcode.get(candidate);
      if (product) break;
    }

    if (!product) {
      notification.error({
        title: 'Producto no encontrado',
        description: `El producto con el código de barras ${normalizedBarcode} no existe.`,
        placement: 'top',
      });
      return;
    }

    const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
    const numericBarcode = normalizeBarcodeDigits(normalizedBarcode);
    const scannedProduct: ProductRecord =
      isVariableWeightBarcode(numericBarcode) && isSoldByWeight
        ? {
            ...(product as ProductRecord),
            weightDetail: {
              ...product.weightDetail,
              weight: toWeightValue(
                formatWeight(toWeightInfoString(extractWeightInfo(numericBarcode))),
              ),
            },
          }
        : (product as ProductRecord);

    void resolveProductStockSelection({
      product: scannedProduct,
      user,
    })
      .then((selection) => {
        if (selection.kind === 'direct') {
          const added = dispatchResolvedScannedProduct(selection.product);
          if (added && isVariableWeightBarcode(numericBarcode) && isSoldByWeight) {
            notification.success({
              title: 'Producto agregado',
              description: `${scannedProduct.name} ${scannedProduct.weightDetail?.weight ?? ''}`,
              placement: 'top',
              duration: 3,
            });
          }
          return;
        }

        if (selection.kind === 'unavailable') {
          notification.warning({
            title: 'Sin disponibilidad',
            description: selection.message,
            placement: 'top',
          });
          return;
        }

        const existingCartProduct = Array.isArray(cartData?.products)
          ? cartData.products.find(
              (item) =>
                item?.id === scannedProduct.id &&
                item?.restrictSaleWithoutStock &&
                (!item?.productStockId || !item?.batchId),
            )
          : null;

        notification[
          selection.reason === 'single-expired' ? 'warning' : 'info'
        ]({
          title: 'Selecciona la existencia física',
          description: selection.message,
          placement: 'top',
        });
        dispatch(
          openProductStockSimple(
            (existingCartProduct as ProductRecord | null) ?? scannedProduct,
          ),
        );
      })
      .catch((error) => {
        console.error('Error resolving product stock selection:', error);
        if (scannedProduct?.restrictSaleWithoutStock) {
          notification.warning({
            title: 'Selecciona la existencia física',
            description:
              'No se pudo validar el inventario automáticamente. Selecciona una ubicación o lote antes de continuar.',
            placement: 'top',
          });
          dispatch(openProductStockSimple(scannedProduct));
          return;
        }

        dispatchResolvedScannedProduct(scannedProduct);
      });
  };

  useBarcodeScanner(checkBarcode);

  const filteredVisibleProducts = useMemo(
    () =>
      normalizedSearchTerm
        ? indexedVisibleProducts
            .filter(({ searchIndex }) => searchIndex.includes(normalizedSearchTerm))
            .map(({ product }) => product)
        : visibleProducts,
    [indexedVisibleProducts, normalizedSearchTerm, visibleProducts],
  );
  const normalizedProducts = useMemo(
    () => filteredVisibleProducts.map(normalizeProductRecord),
    [filteredVisibleProducts],
  );

  const filteredVisibleStockTotal = useMemo(
    () =>
      filteredVisibleProducts.reduce(
        (sum, product) => sum + (Number(product?.stock ?? 0) || 0),
        0,
      ),
    [filteredVisibleProducts],
  );
  const statusMeta = useMemo(
    () => ({
      ...stockMeta,
      filterActive:
        Boolean(stockMeta.filterActive) || normalizedSearchTerm.length > 0,
      productCount: filteredVisibleProducts.length,
      visibleStockTotal: filteredVisibleStockTotal,
    }),
    [
      stockMeta,
      normalizedSearchTerm,
      filteredVisibleProducts.length,
      filteredVisibleStockTotal,
    ],
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

  const handleLockedProductControlClick = useCallback(() => {
    setCashRegisterModalRequested(true);
  }, []);

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
            showNotificationButton
            forceRender
          />
          <ProductControlEfficientMemo
            productsLoading={productsLoading}
            products={normalizedProducts}
            statusMeta={statusMeta}
            isLocked={isBlockingCashRegisterStatus}
            onLockedClick={handleLockedProductControlClick}
          />
          <MenuComponents />
        </ProductContainer>
        <Cart />
      </Container>
      {cartSettings?.isInvoicePanelOpen ? <InvoicePanel /> : null}
      <ProductBatchModal />
      <CashRegisterAlertModal
        open={isCashRegisterModalOpen}
        onClose={() => {
          if (typeof cashRegisterStatus === 'string') {
            setDismissedCashRegisterStatus(cashRegisterStatus);
          }
          setCashRegisterModalRequested(false);
        }}
        status={cashRegisterStatus}
      />
    </>
  );
};

const Container = styled(m.div)`
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
