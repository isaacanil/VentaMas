import { App } from 'antd';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import type { RootState } from '@/app/store';
import { selectUser } from '@/features/auth/userSlice';
import {
  addProduct,
  deleteProduct,
  addAmountToProduct,
} from '@/features/cart/cartSlice';
import type { Product as CartProduct } from '@/features/cart/types';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import type { MonetaryRateConfig } from '@/utils/accounting/lineMonetary';
import { resolveProductStockSelection } from '@/utils/inventory/productStockSelection';
import { getTotalPrice } from '@/utils/pricing';
import type { ProductRecord } from '@/types/products';
import type { UserIdentity } from '@/types/users';
import { resolveProductForCartDocumentCurrency } from '@/features/cart/utils/documentPricing';

import {
  useProductInCart,
  useProductStockStatus,
} from './useProductCartAndStock';

type ProductState = {
  imageHidden: boolean;
  isImageLoaded?: boolean;
};

type CartDataSnapshot = {
  documentCurrency?: SupportedDocumentCurrency;
  functionalCurrency?: SupportedDocumentCurrency;
  manualRatesByCurrency?: Partial<
    Record<SupportedDocumentCurrency, MonetaryRateConfig>
  >;
  products?: CartProduct[];
} | null;

const EMPTY_CART_PRODUCTS: CartProduct[] = [];

export const useProductHandling = (
  product: ProductRecord,
  taxationEnabled: boolean,
) => {
  const dispatch = useDispatch();
  const store = useStore() as { getState: () => RootState };
  const user = useSelector(selectUser) as UserIdentity | null;
  const { notification } = App.useApp();

  const [productState, setProductState] = useState<ProductState>({
    imageHidden: false,
  });

  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

  const { status: isProductInCart, product: productInCart } = useProductInCart(
    product?.id,
  );

  const { isLowStock, isCriticalStock, isOutOfStock } = useProductStockStatus(
    productInCart,
    product,
  );

  const price = getTotalPrice(product, taxationEnabled);
  const getLatestCartData = (): CartDataSnapshot =>
    (store.getState().cart?.data ?? null) as CartDataSnapshot;

  const resolveDocumentPricing = (
    nextProduct: ProductRecord,
    cartData: CartDataSnapshot,
  ) => {
    const cartProducts = Array.isArray(cartData?.products)
      ? cartData.products
      : EMPTY_CART_PRODUCTS;
    const currentCartCurrencies = cartProducts
      .map((item) => item?.monetary?.documentCurrency)
      .filter(
        (currency): currency is SupportedDocumentCurrency => Boolean(currency),
      );

    return resolveProductForCartDocumentCurrency(
      nextProduct as CartProduct,
      normalizeSupportedDocumentCurrency(cartData?.documentCurrency),
      {
        hasCartProducts: cartProducts.length > 0,
        functionalCurrency: normalizeSupportedDocumentCurrency(
          cartData?.functionalCurrency,
        ),
        manualRatesByCurrency: cartData?.manualRatesByCurrency,
        currentCartCurrencies,
      },
    );
  };

  const notifyDocumentCurrencyBlock = (reason?: string) => {
    notification.warning({
      message: 'Producto no elegible para esta moneda',
      description:
        reason ??
        'Este producto no puede agregarse con la moneda documental actual.',
      placement: 'bottomRight',
    });
  };

  const dispatchResolvedProduct = (nextProduct: ProductRecord) => {
    const cartData = getLatestCartData();
    const resolution = resolveDocumentPricing(nextProduct, cartData);

    if (!resolution.eligible || !resolution.product) {
      notifyDocumentCurrencyBlock(resolution.reason);
      return false;
    }

    const cartProducts = Array.isArray(cartData?.products)
      ? cartData.products
      : EMPTY_CART_PRODUCTS;
    const matchingStrictLine =
      cartProducts.find(
        (cartProduct) =>
          cartProduct.id === resolution.product.id &&
          !cartProduct.weightDetail?.isSoldByWeight &&
          String(cartProduct.productStockId ?? '') ===
            String(resolution.product.productStockId ?? '') &&
          String(cartProduct.batchId ?? '') ===
            String(resolution.product.batchId ?? ''),
      ) ?? null;

    if (
      resolution.product.restrictSaleWithoutStock &&
      matchingStrictLine &&
      Number.isFinite(Number(matchingStrictLine.stock)) &&
      Number(matchingStrictLine.amountToBuy || 0) >=
        Number(matchingStrictLine.stock)
    ) {
      notification.warning({
        message: 'Cantidad máxima alcanzada',
        description: `No puedes agregar más unidades. El stock disponible es ${Number(matchingStrictLine.stock)}.`,
        placement: 'bottomRight',
      });
      return false;
    }

    dispatch(addProduct(resolution.product));
    return true;
  };

  const deleteProductFromCart = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const cartData = getLatestCartData();
    const cartProducts = Array.isArray(cartData?.products)
      ? cartData.products
      : EMPTY_CART_PRODUCTS;
    const matchingCartLines = cartProducts.filter(
      (cartProduct) => cartProduct.id === product?.id,
    );
    if (
      product?.restrictSaleWithoutStock &&
      matchingCartLines.length > 1
    ) {
      notification.info({
        message: 'Gestiona este producto desde el carrito',
        description:
          'Este producto ya tiene varias líneas por lote o ubicación. Elimínalo desde el carrito para no afectar la línea equivocada.',
        placement: 'bottomRight',
      });
      return;
    }

    const cartLineId = productInCart?.cid ?? matchingCartLines[0]?.cid;
    if (isProductInCart && cartLineId) {
      dispatch(deleteProduct(cartLineId));
    }
  };

  const isCartProductMissingPhysicalSelection = Boolean(
    productInCart?.restrictSaleWithoutStock &&
      (!productInCart?.productStockId || !productInCart?.batchId),
  );

  const handleGetThisProduct = async (e?: MouseEvent) => {
    if (e) e.stopPropagation();

    if (!user) return;
    const cartData = getLatestCartData();
    const documentPricingResolution = resolveDocumentPricing(product, cartData);

    if (!documentPricingResolution.eligible) {
      notifyDocumentCurrencyBlock(documentPricingResolution.reason);
      return;
    }

    if (isProductInCart && !product?.restrictSaleWithoutStock) {
      if (isCartProductMissingPhysicalSelection) {
        notification.info({
          message: 'Selecciona la existencia física',
          description:
            'Este producto necesita una ubicación o lote antes de seguir agregándolo.',
          placement: 'bottomRight',
        });
        dispatch(openProductStockSimple(productInCart as ProductRecord));
        return;
      }

      // Check stock limit for current batch
      const currentStock = Number(productInCart?.stock);
      const currentAmount = Number(productInCart?.amountToBuy || 0);

      if (Number.isFinite(currentStock) && currentAmount >= currentStock) {
        notification.warning({
          message: 'Cantidad máxima alcanzada',
          description: `No puedes agregar más unidades. El stock disponible es ${currentStock}.`,
          placement: 'bottomRight',
        });
        return;
      }

      // If already in cart and under limit, add quantity
      if (!documentPricingResolution.eligible) {
        notifyDocumentCurrencyBlock(documentPricingResolution.reason);
        return;
      }
      dispatch(addAmountToProduct({ id: product.id }));
      return;
    }

    // Always check stock availability to determine if we need to show the modal
    setIsFirebaseLoading(true);
    void resolveProductStockSelection({
      product,
      user,
    })
      .then(
        (selection) => {
          if (selection.kind === 'direct') {
            dispatchResolvedProduct(selection.product);
            return;
          }

          if (selection.kind === 'unavailable') {
            notification.warning({
              message: 'Sin disponibilidad',
              description: selection.message,
              placement: 'bottomRight',
            });
            return;
          }

          notification[
            selection.reason === 'single-expired' ? 'warning' : 'info'
          ]({
            message: 'Selecciona la existencia física',
            description: selection.message,
            placement: 'bottomRight',
          });
          dispatch(openProductStockSimple(product));
        },
        (error) => {
          console.error('Error fetching product stocks:', error);
          if (product?.restrictSaleWithoutStock) {
            notification.warning({
              message: 'Selecciona la existencia física',
              description:
                'No se pudo validar el inventario automáticamente. Selecciona una ubicación o lote antes de continuar.',
              placement: 'bottomRight',
            });
            dispatch(openProductStockSimple(product));
          } else {
            dispatchResolvedProduct(product);
          }
        },
      )
      .finally(() => {
        // Keep loading state briefly for smooth UX
        setTimeout(() => setIsFirebaseLoading(false), 300);
      });
  };

  return {
    productState,
    setProductState,
    isProductInCart,
    productInCart,
    isLowStock,
    isCriticalStock,
    isOutOfStock,
    price,
    handleGetThisProduct,
    deleteProductFromCart,
    isFirebaseLoading,
  };
};
