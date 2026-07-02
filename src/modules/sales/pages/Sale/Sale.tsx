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
import {
  normalizeSaleUnitForCart,
  resolveProductBaseQuantity,
} from '@/domain/products/saleUnits';
import {
  filterSellableProducts,
  isProductVisibleForSale,
} from '@/domain/products/productInventoryLogic';
import { clearTaxReceiptData } from '@/features/taxReceipt/taxReceiptSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { useBarcodeScanner } from '@/shared/barcode/useBarcodeScanner';
import useViewportWidth from '@/hooks/useViewportWidth';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import type { MonetaryRateConfig } from '@/utils/accounting/lineMonetary';
import {
  extractWeightInfo,
  formatWeight,
  isVariableWeightBarcode,
  normalizeBarcodeDigits,
  normalizeBarcodeValue,
} from '@/utils/barcode';
import {
  resolveProductStockSelection,
  shouldResolveProductStockSelection,
} from '@/modules/sales/pages/Sale/utils/productStockSelection';
import { sumCartBaseQuantityForPhysicalStock } from '@/modules/sales/pages/Sale/utils/cartPhysicalStockUsage';
import { useSellableStockAvailability } from '@/modules/sales/pages/Sale/hooks/useSellableStockAvailability';
import { ClientSelector } from '@/modules/contacts/public';
import { ProductBatchModal } from '@/modules/inventory/public';
import { MenuApp } from '@/modules/navigation/public';
import { MenuComponents } from '@/modules/sales/components/MenuComponents/MenuComponents';

import { Cart } from './components/Cart/Cart';
import { InvoicePanel } from './components/Cart/components/InvoicePanel/InvoicePanel';
import { CashRegisterAlertModal } from './components/modals/CashRegisterAlertModal';
import { ProductControlEfficient } from './components/ProductControl/ProductControlEfficient';
import {
  buildProductSearchIndex,
  normalizeProductSearchTerm,
} from './utils/productSearch';
import { buildSaleUnitProductEntries } from './utils/saleUnitProductEntries';
import {
  buildSaleBarcodeIndex,
  findSaleBarcodeMatch,
  type BarcodeProductMatch,
} from './utils/saleBarcodeIndex';

import type { Dispatch, SetStateAction, JSX } from 'react';
import type { ProductRecord, ProductSaleUnit } from '@/types/products';
import type { UserIdentity } from '@/types/users';
import type { ComponentType, ReactNode } from 'react';

interface Product {
  barcode?: string | number;
  saleUnits?: ProductSaleUnit[];
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

type SaleBarcodeProductMatch = BarcodeProductMatch<Product>;

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

const buildSellableProductSearchIndex = (product: ProductRecord): string => {
  const {
    saleUnits: omittedSaleUnits,
    selectedSaleUnit,
    ...searchableProduct
  } = product;
  void omittedSaleUnits;
  const saleUnitSearchIndex = selectedSaleUnit
    ? buildProductSearchIndex(selectedSaleUnit)
    : '';

  return `${buildProductSearchIndex(searchableProduct)} ${saleUnitSearchIndex}`;
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
  const selectedStockLocationScopes = useMemo(() => {
    const selectedWarehouses = stockMeta.selectedWarehouses;
    return Array.isArray(selectedWarehouses)
      ? selectedWarehouses
          .map((location) =>
            typeof location === 'string' ? location.trim() : '',
          )
          .filter(Boolean)
      : [];
  }, [stockMeta]);
  const sellableStockAvailability = useSellableStockAvailability(user, {
    locationScopes: selectedStockLocationScopes,
  });

  const productsList = products;
  const visibleProducts = useMemo(
    () => filterSellableProducts(productsList),
    [productsList],
  );
  const sellableProductEntries = useMemo(
    () =>
      visibleProducts.flatMap((product) =>
        buildSaleUnitProductEntries(normalizeProductRecord(product), {
          stockAvailabilityByProductId: sellableStockAvailability.index,
          stockAvailabilityCanFilter: sellableStockAvailability.canFilter,
          stockAvailabilityReady: sellableStockAvailability.ready,
        }),
      ),
    [sellableStockAvailability, visibleProducts],
  );
  const indexedVisibleProducts = useMemo(
    () =>
      sellableProductEntries.map((product) => ({
        product,
        searchIndex: buildSellableProductSearchIndex(product),
      })),
    [sellableProductEntries],
  );
  const normalizedSearchTerm = useMemo(
    () => normalizeProductSearchTerm(deferredSearchData),
    [deferredSearchData],
  );
  const currentCartCurrencies = Array.isArray(cartData?.products)
    ? cartData.products
        .map((item) => (item as any)?.monetary?.documentCurrency)
        .filter((currency): currency is SupportedDocumentCurrency =>
          Boolean(currency),
        )
    : [];
  const productsByBarcode = useMemo(
    () => buildSaleBarcodeIndex(visibleProducts),
    [visibleProducts],
  );

  // NOTA: El bloqueo de clics ahora se maneja mediante un overlay en ProductControlEfficient

  const dispatchResolvedScannedProduct = (product: ProductRecord) => {
    if (!isProductVisibleForSale(product)) {
      notification.warning({
        title: 'Producto no vendible',
        description:
          'Este artículo es de uso interno y no puede agregarse a la venta.',
        placement: 'top',
      });
      return false;
    }

    const documentCurrency = normalizeSupportedDocumentCurrency(
      cartData?.documentCurrency,
    );
    const resolution = resolveProductForCartDocumentCurrency(
      product as any,
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

    const cartProducts = Array.isArray(cartData?.products)
      ? cartData.products
      : [];
    const candidateStock = Number(resolution.product.stock);
    if (
      resolution.product.restrictSaleWithoutStock &&
      Number.isFinite(candidateStock) &&
      candidateStock > 0
    ) {
      const currentBaseQuantity = sumCartBaseQuantityForPhysicalStock(
        cartProducts,
        resolution.product,
      );
      const nextBaseQuantity = resolveProductBaseQuantity(resolution.product);
      if (currentBaseQuantity + nextBaseQuantity > candidateStock) {
        notification.warning({
          title: 'Cantidad máxima alcanzada',
          description: `No puedes agregar más unidades. El stock disponible es ${candidateStock}.`,
          placement: 'top',
        });
        return false;
      }
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

    const barcodeMatch: SaleBarcodeProductMatch | undefined =
      findSaleBarcodeMatch(productsByBarcode, normalizedBarcode);

    const product = barcodeMatch?.product;
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
    const scannedProductBase: ProductRecord =
      isVariableWeightBarcode(numericBarcode) && isSoldByWeight
        ? {
            ...(product as ProductRecord),
            weightDetail: {
              ...product.weightDetail,
              weight: toWeightValue(
                formatWeight(
                  toWeightInfoString(extractWeightInfo(numericBarcode)),
                ),
              ),
            },
          }
        : (product as ProductRecord);
    const scannedProduct = barcodeMatch?.saleUnit
      ? {
          ...scannedProductBase,
          selectedSaleUnit: normalizeSaleUnitForCart(barcodeMatch.saleUnit),
        }
      : scannedProductBase;

    if (!shouldResolveProductStockSelection(scannedProduct)) {
      dispatchResolvedScannedProduct(scannedProduct);
      return;
    }

    void resolveProductStockSelection({
      product: scannedProduct,
      user,
    })
      .then((selection) => {
        if (selection.kind === 'direct') {
          const added = dispatchResolvedScannedProduct(selection.product);
          if (
            added &&
            isVariableWeightBarcode(numericBarcode) &&
            isSoldByWeight
          ) {
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
                String(item?.selectedSaleUnit?.id ?? 'default') ===
                  String(scannedProduct.selectedSaleUnit?.id ?? 'default') &&
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
          openProductStockSimple({
            product:
              (existingCartProduct as ProductRecord | null) ?? scannedProduct,
            initialStocks: selection.availableStocks,
          }),
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

  const searchTokens = useMemo(
    () => normalizedSearchTerm.split(/\s+/).filter(Boolean),
    [normalizedSearchTerm]
  );

  const filteredVisibleProducts = useMemo(
    () =>
      searchTokens.length > 0
        ? indexedVisibleProducts
            .filter(({ searchIndex }) =>
              searchTokens.every((token) => searchIndex.includes(token)),
            )
            .map(({ product }) => product)
        : sellableProductEntries,
    [indexedVisibleProducts, searchTokens, sellableProductEntries],
  );
  const normalizedProducts = filteredVisibleProducts;

  const filteredVisibleStockTotal = useMemo(() => {
    const countedProductIds = new Set<string>();
    return filteredVisibleProducts.reduce((sum, product) => {
      const productId = String(product?.id ?? '');
      if (productId && countedProductIds.has(productId)) return sum;
      if (productId) countedProductIds.add(productId);
      return sum + (Number(product?.stock ?? 0) || 0);
    }, 0);
  }, [filteredVisibleProducts]);
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
            productsLoading={
              productsLoading || !sellableStockAvailability.ready
            }
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
